import { Sandbox } from "@e2b/code-interpreter";
import { prisma } from "@/lib/prisma";

const SANDBOX_TTL = 300; // 5 minutes idle timeout

/**
 * Get or create an E2B sandbox for a given conversation.
 * Sandboxes persist for the lifetime of the conversation.
 * New conversation = new sandbox VM.
 */
export async function getOrCreateSandbox(conversationId: string): Promise<Sandbox> {
  // Check if conversation already has a sandbox
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { sandboxId: true },
  });

  if (conversation?.sandboxId) {
    try {
      // Try to reconnect to existing sandbox
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

  // Store sandbox ID on conversation
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { sandboxId: sandbox.sandboxId },
  });

  console.log(`[E2B] sandbox created conversationId=${conversationId} sandboxId=${sandbox.sandboxId}`);
  return sandbox;
}
