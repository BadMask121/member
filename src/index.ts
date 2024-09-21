import InitializeBot from "./handlers/initialize-bot";
import { createCallApiV2 } from "./lib/createApi";

export const initializeBot = createCallApiV2(InitializeBot, {
  timeoutSeconds: 520,
});
