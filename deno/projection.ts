import {
  Collection,
  Database,
  MongoClient,
  ObjectId,
} from "https://deno.land/x/mongo@v0.31.2/mod.ts";
import { EventEmitter } from "https://deno.land/x/event@2.0.1/mod.ts";

// Defining schema interface
interface GiftCardSchema {
  _id: ObjectId;
  cardId: string;
  initialValue: number;
  remainingValue: number;
  issued: Date;
  lastUpdated: Date;
  canceled: boolean;
  sequenceNumber: number;
}

interface InitSchema {
  _id: ObjectId;
  activeEventHandler: string;
}

class Initialisation extends Error {
  constructor(message: string) {
    super(message);
    this.name = "Inaccessible";
  }
}

const client = new MongoClient();
let db: Database;
let giftCards: Collection;
const axoniqDateTime = "axoniq-datetime";
const axoniqSequenceNumber = "axoniq-sequencenumber";
const issuedEvent = "io.axoniq.demo.giftcard.api.CardIssuedEvent";
const redeemedEvent = "io.axoniq.demo.giftcard.api.CardRedeemedEvent";
const cancelledEvent = "io.axoniq.demo.giftcard.api.CardCanceledEvent";
const cardIdEmitter = new EventEmitter<GiftCardSchema>();
const okResponse = () => new Response("Ok", { status: 200 });

export const allCards = async () => {
  return giftCards.find({ cardId: { $ne: null } }).toArray();
};

export const activeCards = async () => {
  return giftCards
    .find({
      cardId: { $ne: null },
      remainingValue: { $ne: 0 },
      canceled: false,
    })
    .toArray();
};

export const oneCard = async (cardId: string) => {
  const event = await giftCards.findOne({ cardId: cardId });
  return event.value;
};

export const nextOneCard = async (cardId: string) => {
  const [event] = await cardIdEmitter.once(cardId);
  return event;
};

const emitUpdatedCard = async (cardId: string) => {
  const card = await giftCards.findOne({ cardId: cardId });
  return cardIdEmitter.emit(cardId, card);
};

const storeGiftCard = async (req: Request) => {
  const date = new Date(req.headers.get(axoniqDateTime));
  const payload = await req.json();
  console.log(
    "Received issue card event via Synapse:\n" + JSON.stringify(payload),
  );
  const cardId = payload["id"];
  await giftCards.insertOne({
    cardId: cardId,
    initialValue: payload["amount"],
    remainingValue: payload["amount"],
    issued: date,
    lastUpdated: date,
    canceled: false,
    sequenceNumber: 0,
  });
  await emitUpdatedCard(cardId);
  return okResponse();
};

const redeemGiftCard = async (req: Request) => {
  const date = new Date(req.headers.get(axoniqDateTime));
  const sequenceNumber = Number(req.headers.get(axoniqSequenceNumber));
  const payload = await req.json();
  console.log(
    "Received redeem card event via Synapse:\n" + JSON.stringify(payload),
  );
  const cardId = payload["id"];
  await giftCards.updateOne(
    { cardId: cardId, sequenceNumber: sequenceNumber - 1 },
    {
      $inc: { remainingValue: -payload["amount"], sequenceNumber: 1 },
      $set: { lastUpdated: date },
    },
  );
  await emitUpdatedCard(cardId);
  return okResponse();
};

const cancelGiftCard = async (req: Request) => {
  const date = new Date(req.headers.get(axoniqDateTime));
  const sequenceNumber = Number(req.headers.get(axoniqSequenceNumber));
  const payload = await req.json();
  console.log(
    "Received cancel card event via Synapse:\n" + JSON.stringify(payload),
  );
  const cardId = payload["id"];
  await giftCards.updateOne(
    { cardId: cardId, sequenceNumber: sequenceNumber - 1 },
    {
      $inc: { sequenceNumber: 1 },
      $set: { canceled: true, lastUpdated: date },
    },
  );
  await emitUpdatedCard(cardId);
  return okResponse();
};

export const stream = async function* () {
  for await (const event of cardIdEmitter) {
    yield { streamGiftCards: event.value[0] };
  }
};

export const streamOne = async function* (cardId: string) {
  for await (const [card] of cardIdEmitter.on(cardId)) {
    yield { streamGiftCard: card };
  }
};

export const handleEvent = async (req: Request) => {
  switch (req.headers.get("axoniq-eventname")) {
    case issuedEvent:
      return storeGiftCard(req);
    case redeemedEvent:
      return redeemGiftCard(req);
    case cancelledEvent:
      return cancelGiftCard(req);
    default:
      return new Response("Unknown event", { status: 404 });
  }
};

const subscribeToEvents = async (init: Collection) => {
  const body = JSON.stringify({
    names: [issuedEvent, redeemedEvent, cancelledEvent],
    endpoint: "http://host.docker.internal:3000/events",
    endpointType: "http-raw",
    clientId: "giftcard-graphql",
    componentName: "DenoGraphQlEndpoint",
  });
  let reply = await fetch(
    "http://localhost:8081/v1/contexts/default/handlers/events",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    },
  );
  if (!reply.ok) {
    console.log(reply);
    throw new Initialisation("Could not subscribe to events.");
  }
  const activeEventHandler = reply.headers.get("location");
  await init.insertOne({
    activeEventHandler: activeEventHandler,
  });
  console.log("Subscribed to events via Synapse");
};

export const createIndexes = () => {
  giftCards.createIndexes({
    indexes: [{ key: { cardId: 1 }, name: "giftcard_cardid", unique: true }],
  });
};

export const removeEventHandler = async (
  activeEventHandler: string,
  init: Collection,
) => {
  const reply = await fetch(activeEventHandler, { method: "DELETE" });
  if (!reply.ok) {
    console.log(reply);
    throw new Initialisation(
      "Could not remove current event handler subscription.",
    );
  }
  await init.deleteOne({ activeEventHandler: activeEventHandler });
  console.log("Removed previous event handler");
};

// @ts-ignore
export const initProjection = async () => {
  try {
    await client.connect("mongodb://127.0.0.1:27017");
    db = client.database("deno");
    giftCards = db.collection<GiftCardSchema>("giftcards");
  } catch (e) {
    console.log(e);
    throw new Initialisation(
      "Could not connect to Mongo, maybe you need to run docker compose or wait till it's initialized.",
    );
  }
  createIndexes();
  const init = db.collection<InitSchema>("init");
  const currentInit = await init
    .find({ activeEventHandler: { $ne: null } })
    .next();
  if (currentInit !== undefined) {
    await removeEventHandler(currentInit.activeEventHandler, init);
    const deleted = await giftCards.deleteMany({});
    console.log(
      "Reset giftcard collection by removing " + deleted + " documents",
    );
  }
  await subscribeToEvents(init);
};
