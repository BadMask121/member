import { openai } from "@ai-sdk/openai";
import { embed, embedMany } from "ai";
import OpenAI from "openai";
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
}

function generateChunks(input: string): string[] {
  return input
    .trim()
    .split(".")
    .filter((i) => i !== "");
}
