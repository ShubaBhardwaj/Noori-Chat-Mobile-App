import { createGoogle } from "@ai-sdk/google";
import { env } from "../env";

const google = createGoogle({
    apiKey: env.googleApiKey,
});

export const chatModel = google.chat(env.chatModel);
export const embeddingModel = google.textEmbeddingModel(env.embeddingModel);

export const chatModelId = env.chatModel;