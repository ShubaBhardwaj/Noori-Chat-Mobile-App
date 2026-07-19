import { createOpenAI } from "@ai-sdk/openai";
import { env } from "../env";

const openai = createOpenAI({
    apiKey: env.openaiApiKey,
});

export const chatModel = openai.chat(env.chatModel);
export const embeddingModel = openai.embeddingModel(env.embeddingModel);

export const chatModelId = env.chatModel;