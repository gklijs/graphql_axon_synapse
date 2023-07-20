import {gql} from "https://deno.land/x/graphql_tag@0.0.1/mod.ts";

export const typeDefs = gql`

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
  type CommandResult {
    success: GiftCard
    error: CommandError
  }

  type Query {
    allGiftCards: [GiftCard]
    activeGiftCards: [GiftCard]
    oneGiftCard(cardId: String!): GiftCard
  }

  type Mutation {
    issueCard(cardId: String!, initialValue: Int!): CommandResult
    redeemCard(cardId: String!, value: Int!): CommandResult
    cancelCard(cardId: String!): CommandResult
  }
`;