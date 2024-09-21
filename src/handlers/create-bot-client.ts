import { decode } from "cbor-x";
import { ChatDTO } from "../entities/Chat";
import { whatsApp } from "../lib/dependencies";
import saveMessages from "../lib/save-messages";

interface RequestPayload {
  data: {
    email: string;
    phone: string;
  };
}

/**
 * An endpoint to create a bot client
 * @param req
 * @returns
 */
export default async function CreateBotClient(req: RequestPayload): Promise<RequestPayload> {
  const { data } = req;
  try {
    return req;
  } catch (error) {
    throw new Error("Unable to create bot client");
  }
}
