type WebhookEmbed = {
  title?: string;
  description?: string;
  url?: string;
  color?: number;
  timestamp?: string;
  footer?: { icon_url?: string; text: string };
  thumbnail?: { url: string };
  image?: { url: string };
  author?: { name: string; url?: string; icon_url?: string };
  fields?: { name: string; value: string; inline?: boolean }[];
};

type WebhookPayload =
  | { type: "message"; content: string }
  | { type: "embed"; embed: WebhookEmbed };

export const sendWebhook = async (payload: WebhookPayload) => {
  const body =
    payload.type === "message"
      ? { content: payload.content }
      : { embeds: [payload.embed] };
  await fetch(import.meta.env.VITE_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-type": "application/json" },
    body: JSON.stringify(body),
  });
};
