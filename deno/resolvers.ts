import {activeCards, allCards, oneCard, streamCards} from "./projection.ts";
import {
  sendCancelCardCommand,
  sendIssueCardCommand,
  sendRedeemCardCommand,
} from "./commands.ts";

const allGiftCards = async () => {
  return allCards();
};

const activeGiftCards = async () => {
  return activeCards();
};

const oneGiftCard = async (args: any) => {
  return oneCard(args.cardId);
};

const issueCard = async (args: any) => {
  return sendIssueCardCommand(args.cardId, args.initialValue);
};

const redeemCard = async (args: any) => {
  return sendRedeemCardCommand(args.cardId, args.value);
};

const cancelCard = async (args: any) => {
  return sendCancelCardCommand(args.cardId);
};

export const resolvers = {
  Query: {
    allGiftCards: () => allGiftCards(),
    activeGiftCards: () => activeGiftCards(),
    oneGiftCard: (_: any, args: any) => oneGiftCard(args),
  },
  Mutation: {
    issueGiftCard: (_: any, args: any) => issueCard(args),
    redeemGiftCard: (_: any, args: any) => redeemCard(args),
    cancelGiftCard: (_: any, args: any) => cancelCard(args),
  },
};
