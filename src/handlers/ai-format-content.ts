import { Request, Response } from "express";
import { Redis } from "ioredis";
import { OpenAI } from "openai";
import { InjectedDependency } from "../entities/Dependency";
import { FormatContentInput } from "../schema/note.schema";
import { HttpResponse, result, serverError } from "../lib/http";

export async function FormatNote(
  req: Request,
  res: Response
): Promise<Response<HttpResponse<{ formatted_content: string }>>> {
  const redis = req.app.get(InjectedDependency.Redis) as Redis;
  const openai = req.app.get(InjectedDependency.OpenAI) as OpenAI;
  const { content } = req.body as FormatContentInput;

  // Generate a cache key using a consistent hash
  const cacheKey = `format:${content}`;

  try {
    // Check cache
    const cachedResult = await redis.get(cacheKey);
    if (cachedResult) {
      return result(res, { formatted_content: JSON.parse(cachedResult) });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `
          Please format the following rich text content using html Include headings, lists, emphasized text, and any necessary markup.
          Text to Format:
          \n\n${content}`,
        },
      ],
    });

    const formattedContent = response?.choices[0]?.message?.content?.trim();

    // Cache the result with a TTL of 1 hour
    await redis.set(cacheKey, JSON.stringify(formattedContent), "EX", 3600);

    return result(res, { formatted_content: formattedContent });
  } catch (error) {
    return serverError(res, error as Error);
  }
}
