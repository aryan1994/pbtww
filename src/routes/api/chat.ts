import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const SYSTEM_PROMPT = `You are Hydra Assist — the friendly support chatbot for PAPPU BHAI TANKER WALE (PBTW), a water tanker delivery service in Beawar, Rajasthan, India.

Greet new chats with: "Hi there, I am Hydra Assist. How can I help you?"

Facts you can rely on:
- We deliver drinking, construction and tested water tankers across Beawar.
- Delivery charge: ₹59/km (distance from depot to drop point).
- Pay with cash, UPI, or PBTW Wallet. Wallet pays earn an automatic 15% discount.
- Customers can recharge their wallet from "Wallet → Recharge" — they upload a UPI payment screenshot, then an admin approves it.
- Drivers can join from the "Drive with us" page.
- Customer support / WhatsApp: 9214775938.

Be concise (1-3 short paragraphs), warm, and answer in the user's language (English / Hindi / Hinglish). If you don't know something specific (exact ETA, today's prices for a custom truck), ask them to WhatsApp 9214775938.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages } = (await request.json()) as { messages?: UIMessage[] };
        if (!Array.isArray(messages)) {
          return new Response("Messages required", { status: 400 });
        }
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const gateway = createLovableAiGatewayProvider(key);
        const result = streamText({
          model: gateway("google/gemini-3-flash-preview"),
          system: SYSTEM_PROMPT,
          messages: await convertToModelMessages(messages),
        });
        return result.toUIMessageStreamResponse({ originalMessages: messages });
      },
    },
  },
});
