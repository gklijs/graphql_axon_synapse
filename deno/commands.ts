import { nextOneCard } from "./projection.ts";

const sendCommand = async (
  cardId: string,
  payload: Object,
  commandName: string,
  timeout: number,
) => {
  const card = fetchNextCard(cardId, timeout);
  const body = JSON.stringify(payload);
  let reply = await fetch(
    "http://localhost:8081/v1/contexts/default/commands/" + commandName,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "AxonIQ-RoutingKey": cardId,
      },
      body,
    },
  );
  if (reply.status === 200) {
    return card;
  } else {
    return reply.json();
  }
};

const fetchNextCard = async (cardId: string, timeout: number) => {
  const timer = new Promise((resolve) => {
    setTimeout(resolve, timeout, { reason: "Timed out waiting for event." });
  });
  return Promise.race([timer, nextOneCard(cardId)]);
};

export const sendIssueCardCommand = async (
  cardId: string,
  initialValue: number,
  timeout: number,
) => {
  const payload = {
    id: cardId,
    amount: initialValue,
  };
  return sendCommand(
    cardId,
    payload,
    "io.axoniq.demo.giftcard.api.IssueCardCommand",
    timeout,
  );
};

export const sendRedeemCardCommand = async (
  cardId: string,
  value: number,
  timeout: number,
) => {
  const payload = {
    id: cardId,
    amount: value,
  };
  return sendCommand(
    cardId,
    payload,
    "io.axoniq.demo.giftcard.api.RedeemCardCommand",
    timeout,
  );
};

export const sendCancelCardCommand = async (
  cardId: string,
  timeout: number,
) => {
  const payload = {
    id: cardId,
  };
  return sendCommand(
    cardId,
    payload,
    "io.axoniq.demo.giftcard.api.CancelCardCommand",
    timeout,
  );
};
