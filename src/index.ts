import DeleteNote from "./handlers/delete-note";
import { createCallApiV2 } from "./lib/createApi";

export const deleteNote = createCallApiV2(DeleteNote, {
  timeoutSeconds: 520,
});
