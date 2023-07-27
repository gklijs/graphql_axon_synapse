import {
  MongoClient,
  ObjectId,
} from "https://deno.land/x/mongo@v0.31.2/mod.ts";
import { EventEmitter } from "https://deno.land/x/event@2.0.1/mod.ts";

const client = new MongoClient();

// Connecting to a Local Database
await client.connect("mongodb://127.0.0.1:27017");

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

const db = client.database("deno");
const giftCards = db.collection<GiftCardSchema>("giftcards");
const axoniqDateTime = "axoniq-datetime";
const axoniqSequenceNumber = "axoniq-sequencenumber";
const okResponse = () => new Response("Ok", { status: 200 });
const issuedEvent = "io.axoniq.demo.giftcard.api.CardIssuedEvent";
const redeemedEvent = "io.axoniq.demo.giftcard.api.CardRedeemedEvent";
const cancelledEvent = "io.axoniq.demo.giftcard.api.CardCanceledEvent";
const cardIdEmitter = new EventEmitter<String>();

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

export const oneCard = async (cardId: String) => {
  return giftCards.findOne({ cardId: cardId });
};

export const nextOneCard = async (cardId: String) => {
  await cardIdEmitter.once(cardId);
  return giftCards.findOne({ cardId: cardId });
};

const storeGiftCard = async (req: Request) => {
  const date = new Date(req.headers.get(axoniqDateTime));
  const payload = await req.json();
  await giftCards.insertOne({
    cardId: payload["id"],
    initialValue: payload["amount"],
    remainingValue: payload["amount"],
    issued: date,
    lastUpdated: date,
    canceled: false,
    sequenceNumber: 0,
  });
  cardIdEmitter.emit(payload["id"]);
  return okResponse();
};

const redeemGiftCard = async (req: Request) => {
  const date = new Date(req.headers.get(axoniqDateTime));
  const sequenceNumber = Number(req.headers.get(axoniqSequenceNumber));
  const payload = await req.json();
  await giftCards.updateOne(
    { cardId: payload["id"], sequenceNumber: sequenceNumber - 1 },
    {
      $inc: { remainingValue: -payload["amount"], sequenceNumber: 1 },
      $set: { lastUpdated: date },
    },
  );
  cardIdEmitter.emit(payload["id"]);
  return okResponse();
};

const cancelGiftCard = async (req: Request) => {
  const date = new Date(req.headers.get(axoniqDateTime));
  const sequenceNumber = Number(req.headers.get(axoniqSequenceNumber));
  const payload = await req.json();
  await giftCards.updateOne(
    { cardId: payload["id"], sequenceNumber: sequenceNumber - 1 },
    {
      $inc: { sequenceNumber: 1 },
      $set: { canceled: true, lastUpdated: date },
    },
  );
  cardIdEmitter.emit(payload["id"]);
  return okResponse();
};

export const stream = async function* () {
  for await (const event of cardIdEmitter) {
    const card = await oneCard(event.name);
    yield {streamGiftCards: card }
  }
}

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

// @ts-ignore
export const initProjection = async () => {
  giftCards.createIndexes({
    indexes: [{ key: { cardId: 1 }, name: "giftcard_cardid", unique: true }],
  });
  const init = db.collection<InitSchema>("init");
  const currentInit = await init
    .find({ activeEventHandler: { $ne: null } })
    .next();
  console.log("Current initialization state: " + JSON.stringify(currentInit));
  if (currentInit === undefined) {
    console.log("Subscribing to events via Synapse");
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
    const activeEventHandler = reply.headers.get("location");
    await init.insertOne({
      activeEventHandler: activeEventHandler,
    });
  }
};
