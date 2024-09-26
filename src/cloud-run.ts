import "dotenv/config";
import { BotClient } from "./entities/BotClient";
import { closeBotWebClient, createBotWebClient } from "./lib/botClient";
import { botClientDao } from "./lib/dependencies";
import express from "express";
/**
 * get all bot user from db and subscribe to their number as client
 */

const botClients = await botClientDao.getAll();

// initate whatsapp web instance for each client
botClients.forEach(createBotWebClient);

// listen to when new client is added then initiate whatsapp web instance
botClientDao.on("added", async <T = BotClient>(data: T) => {
  await createBotWebClient(data as BotClient);
});

// when a bot client is removed destroy the whatsapp web instance
botClientDao.on("removed", async <T = BotClient>(data: T) => {
  await closeBotWebClient(data as BotClient);
});

const PORT = 8080;
const app = express();
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.send(`Member server is running 👍`);
});

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
