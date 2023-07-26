import { activeCards, allCards, oneCard, stream } from "./projection.ts";
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

const streamCards = async () => {
  return stream;
};

export const resolvers = {
  CommandResult: {
    __resolveType(obj, contextValue, info) {
      // Only GiftCard has a cardId field
      if (obj.cardId) {
        return "GiftCard";
      }
      return "CommandError";
    },
  },
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
  Subscription: {
    streamGiftCards: () => streamCards(),
  },
};
