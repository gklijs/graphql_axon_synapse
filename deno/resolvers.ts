import {
  activeCards,
  allCards,
  oneCard,
  stream,
  streamOne,
} from "./projection.ts";
import {
  sendCancelCardCommand,
  sendIssueCardCommand,
  sendRedeemCardCommand,
} from "./commands.ts";

const oneGiftCard = async (args: any) => {
  return oneCard(args.cardId);
};

const issueCard = async (args: any) => {
  const timeout = args.fetchTimeout == null ? 2000 : args.fetchTimeout;
  return sendIssueCardCommand(args.cardId, args.initialValue, timeout);
};

const redeemCard = async (args: any) => {
  const timeout = args.fetchTimeout == null ? 2000 : args.fetchTimeout;
  return sendRedeemCardCommand(args.cardId, args.value, timeout);
};

const cancelCard = async (args: any) => {
  const timeout = args.fetchTimeout == null ? 2000 : args.fetchTimeout;
  return sendCancelCardCommand(args.cardId, timeout);
};

export const resolvers = {
  CommandResult: {
    __resolveType(obj, contextValue, info) {
      // Only GiftCard has a cardId field
      if (obj.cardId) {
        return "GiftCard";
      } else if (obj.reason) {
        return "FetchError";
      } else {
        return "CommandError";
      }
    },
  },
  Query: {
    allGiftCards: () => allCards(),
    activeGiftCards: () => activeCards(),
    oneGiftCard: (_: any, args: any) => oneGiftCard(args),
  },
  Mutation: {
    issueGiftCard: (_: any, args: any) => issueCard(args),
    redeemGiftCard: (_: any, args: any) => redeemCard(args),
    cancelGiftCard: (_: any, args: any) => cancelCard(args),
  },
  Subscription: {
    streamGiftCards: { subscribe: stream },
    streamGiftCard: { subscribe: (_, { cardId }) => streamOne(cardId) },
  },
};
