import { openai } from "@ai-sdk/openai";
import { embed, embedMany } from "ai";
import { HttpsError } from "firebase-functions/v1/auth";
import OpenAI from "openai";
import { AIModel, MediaMessage, Message } from "../entities/AI";
import { delay } from "../lib/delay";
import { IAiService } from "./IAiService";

export default class OpenAIService implements IAiService {
  embeddingModel = openai.embedding("text-embedding-ada-002");

  constructor(readonly _openai: OpenAI) {}

  async embedding(value: string): Promise<number[]> {
    const { embedding } = await embed({
      model: this.embeddingModel,
      value,
    });

    return embedding;
  }

  async embeddings(value: string): Promise<Array<{ embedding: number[]; content: string }>> {
    const chunks = generateChunks(value);
    const { embeddings } = await embedMany({
      model: this.embeddingModel,
      values: chunks,
    });
    return embeddings.map((e, i) => ({ content: chunks[i], embedding: e }));
  }

  /**
   * call openai api with ability to retry request until its successful or termintate on maximum retry reached
   * @param output
   * @param args
   * @param retries
   * @returns
   */
  async callWithRetry(
    messages: Array<Message | MediaMessage>,
    retries = 3
  ): Promise<string | null> {
    const data = {
      model: AIModel.GPT_4_O_mini,
      temperature: 0.4,
    };

    try {
      const result = await this._openai.chat.completions.create({
        ...data,
        messages: messages as OpenAI.ChatCompletionMessageParam[],
      });

      return result.choices?.[0]?.message?.content?.trim() ?? "";
    } catch (e: unknown) {
      const error = e as HttpsError & { response: string };
      if (retries > 0) {
        // when rate limit reached or other error we retry with lower model

        console.warn(`Retry ${4 - retries}: ${error.response}`, { structuredData: true });

        // delay for 300 ms as throttling
        await delay(300);

        return this.callWithRetry(messages, retries - 1);
      }

      return null;
    }
  }
}

function generateChunks(input: string): string[] {
  return input
    .trim()
    .split(".")
    .filter((i) => i !== "");
}
