import InitializeBot from "./handlers/initialize-bot";
import Summarize from "./handlers/summarize";
import { createCallApiV2 } from "./lib/createApi";

export const initializeBot = createCallApiV2(InitializeBot, {
  timeoutSeconds: 520,
});

export const summarize = createCallApiV2(Summarize);
