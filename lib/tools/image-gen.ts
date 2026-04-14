import { tool } from "ai";
import { z } from "zod";

const BUCKET = "generated-images";

/** Upload base64 image to Supabase Storage and return the public URL. */
async function uploadToStorage(base64: string, mediaType: string): Promise<string> {
  const { createClient } = await import("@supabase/supabase-js");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const ext = mediaType.split("/")[1] ?? "png";
  const filename = `${Date.now()}-${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(base64, "base64");

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filename, buffer, { contentType: mediaType, upsert: false });

  if (error) {
    // Bucket may not exist yet — create it and retry once
    if (error.message.includes("Bucket not found") || error.message.includes("does not exist")) {
      const { error: createErr } = await supabase.storage.createBucket(BUCKET, { public: true });
      if (createErr && !createErr.message.includes("already exists")) {
        throw new Error(`Storage bucket creation failed: ${createErr.message}`);
      }
      const { error: retryErr } = await supabase.storage
        .from(BUCKET)
        .upload(filename, buffer, { contentType: mediaType, upsert: false });
      if (retryErr) throw new Error(`Storage upload failed: ${retryErr.message}`);
    } else {
      throw new Error(`Storage upload failed: ${error.message}`);
    }
  }

  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(filename);
  return publicUrl;
}

export const imageGenTool = tool({
  description:
    "Generate an image from a text prompt using DALL-E 3. Returns a URL the user can view. Use this when asked to create, draw, generate, or visualise an image.",
  inputSchema: z.object({
    prompt: z.string().describe("Detailed description of the image to generate"),
    size: z
      .enum(["1024x1024", "1792x1024", "1024x1792"])
      .optional()
      .default("1024x1024")
      .describe("Image dimensions. Default is square 1024x1024."),
    quality: z
      .enum(["standard", "hd"])
      .optional()
      .default("standard")
      .describe("Image quality. 'hd' produces finer details."),
  }),
  // Never throw — always return a result object so AI SDK can produce a valid
  // tool_result block for Anthropic. Throwing causes AI SDK to emit a malformed
  // error tool_result that Claude rejects with "tool_use without tool_result".
  execute: async ({ prompt, size, quality }) => {
    console.log(`[tool:image_gen] prompt="${prompt.slice(0, 80)}…" size=${size} quality=${quality}`);

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("[tool:image_gen] OPENAI_API_KEY is not set");
      return { success: false, error: "Image generation is not configured (missing API key)." };
    }

    try {
      const { generateImage } = await import("ai");
      const { createOpenAI } = await import("@ai-sdk/openai");

      const openai = createOpenAI({ apiKey });

      const { image } = await generateImage({
        model: openai.image("dall-e-3"),
        prompt,
        size: size as `${number}x${number}`,
        providerOptions: {
          openai: { quality: quality ?? "standard" },
        },
      });

      // Upload to Supabase Storage — short HTTP URL, never base64 in tool result.
      // Base64 (~3MB) re-tokenized on every turn would blow the context limit.
      const url = await uploadToStorage(image.base64, image.mediaType);
      console.log(`[tool:image_gen] uploaded url=${url}`);

      return { success: true, url, prompt, mediaType: image.mediaType };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[tool:image_gen] error="${msg}"`);
      // Return error as data — do NOT throw, as AI SDK may produce a malformed
      // tool_result for Anthropic when execute() throws.
      return { success: false, error: `Image generation failed: ${msg}` };
    }
  },
});
