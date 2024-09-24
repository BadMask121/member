/* eslint-disable import/no-mutable-exports */
import OpenAI from "openai";

import { Firestore } from "@google-cloud/firestore";
import { PubSub } from "@google-cloud/pubsub";
import { ICommand } from "../commands/ICommand";
import { InitializationCommand } from "../commands/Initialization";
import { SummarizeCommand } from "../commands/Summarize";
import { BotClientDao } from "../dao/BotClientDao";
import { ChatDao } from "../dao/ChatDao";
import { DaoTable } from "../dao/IDao";
import { MessageDao } from "../dao/MessageDao";
import { Command } from "../entities/Command";
import OpenAIService from "../services/OpenAI";

let firestore!: Firestore;
let pubSub!: PubSub;
let openai!: OpenAI;

if (!firestore) {
  firestore = new Firestore();
}

if (!pubSub) {
  pubSub = new PubSub();
}

if (!openai) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    organization: process.env.OPENAI_API_ORG,
  });
}

// Dao dependencies
export const botClientDao = new BotClientDao(firestore, DaoTable.BotClient);
export const chatDao = new ChatDao(firestore, DaoTable.Chat);
export const messageDao = new MessageDao(firestore, DaoTable.Message);
export const openaiService = new OpenAIService(openai);

export const commands: Record<Command, ICommand> = {
  [Command.Summarize]: new SummarizeCommand(),
  [Command.Initialize]: new InitializationCommand(),
};
export const connectedClients = new Map();

export { firestore, openai, pubSub };
