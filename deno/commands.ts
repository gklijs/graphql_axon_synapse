import { nextOneCard } from "./projection.ts";

const sendCommand = async (
  cardId: String,
  payload: Object,
  commandName: String,
) => {
  const card = fetchNextCard(cardId, 2000);
  const body = JSON.stringify(payload);
  let reply = await fetch(
    "http://localhost:8081/v1/contexts/default/commands/" + commandName,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    },
  );
  if (reply.status === 200) {
    return card;
  } else {
    return reply.json();
  }
};

const fetchNextCard = async (cardId: String, timeout: number) => {
  const timer = new Promise((resolve) => {
    setTimeout(resolve, timeout, { reason: "Timed out waiting for event." });
  });
  return Promise.race([timer, nextOneCard(cardId)]);
};

export const sendIssueCardCommand = async (
  cardId: String,
  initialValue: number,
) => {
  const payload = {
    id: cardId,
    amount: initialValue,
  };
  return sendCommand(
    cardId,
    payload,
    "io.axoniq.demo.giftcard.api.IssueCardCommand",
  );
};

export const sendRedeemCardCommand = async (cardId: String, value: number) => {
  const payload = {
    id: cardId,
    amount: value,
  };
  return sendCommand(
    cardId,
    payload,
    "io.axoniq.demo.giftcard.api.RedeemCardCommand",
  );
};

export const sendCancelCardCommand = async (cardId: String) => {
  const payload = {
    id: cardId,
  };
  return sendCommand(
    cardId,
    payload,
    "io.axoniq.demo.giftcard.api.CancelCardCommand",
  );
};
