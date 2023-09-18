import { createSchema, createYoga } from "graphql-yoga";
import { resolvers } from "./resolvers.ts";

export const yoga = createYoga({
  schema: createSchema({
    typeDefs: /* GraphQL */ `
      scalar DateTime
      type GiftCard {
        cardId: String!
        initialValue: Int!
        remainingValue: Int!
        issued: DateTime!
        lastUpdated: DateTime!
        canceled: Boolean!
      }
      type CommandError {
        path: String!
        code: String!
        error: String!
        requestId: String!
        timestamp: DateTime!
        status: Int!
      }
      type FetchError {
        reason: String!
      }
      union CommandResult = GiftCard | CommandError | FetchError
      type Query {
        allGiftCards: [GiftCard]
        activeGiftCards: [GiftCard]
        oneGiftCard(cardId: String!): GiftCard
      }
      type Mutation {
        issueGiftCard(cardId: String!, initialValue: Int!, fetchTimeout: Int): CommandResult!
        redeemGiftCard(cardId: String!, value: Int!, fetchTimeout: Int): CommandResult!
        cancelGiftCard(cardId: String!, fetchTimeout: Int): CommandResult!
      }
      type Subscription {
        streamGiftCards: GiftCard!
        streamGiftCard(cardId: String!): GiftCard!
      }
    `,
    resolvers: resolvers,
  }),
});
