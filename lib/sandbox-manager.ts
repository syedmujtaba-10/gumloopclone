import { prisma } from "@/lib/prisma";

const SANDBOX_TTL = 300; // 5 minutes idle timeout

/**
 * Get or create an E2B sandbox for a given conversation.
 * Sandboxes persist for the lifetime of the conversation.
 * New conversation = new sandbox VM.
 *
 * Uses a dynamic import for @e2b/code-interpreter so the ESM package is only
 * loaded when a sandbox tool is actually invoked (not at route evaluation time).
 */
export async function getOrCreateSandbox(conversationId: string) {
  // Dynamic import avoids ESM/CJS conflict at module load time on Vercel
  const { Sandbox } = await import("@e2b/code-interpreter");

  // Check if conversation already has a sandbox
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { sandboxId: true },
  });

  if (conversation?.sandboxId) {
    try {
      const sandbox = await Sandbox.connect(conversation.sandboxId);
      console.log(`[E2B] sandbox reconnected conversationId=${conversationId} sandboxId=${conversation.sandboxId}`);
      return sandbox;
    } catch {
      // Sandbox expired — create a new one
      console.log(`[E2B] sandbox expired, creating new one conversationId=${conversationId}`);
    }
  }

  // Create new sandbox VM
  const sandbox = await Sandbox.create({ timeoutMs: SANDBOX_TTL * 1000 });

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { sandboxId: sandbox.sandboxId },
  });

  console.log(`[E2B] sandbox created conversationId=${conversationId} sandboxId=${sandbox.sandboxId}`);
  return sandbox;
}
