import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";

const telegramBotToken = defineSecret("TELEGRAM_BOT_TOKEN");
const telegramChatId = defineSecret("TELEGRAM_CHAT_ID");

export const telegram = onRequest(
  {
    secrets: [telegramBotToken, telegramChatId],
    cors: [/chantha-cmd-web\.github\.io$/],
  },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ ok: false, description: "Method not allowed" });
      return;
    }

    const botToken = telegramBotToken.value();
    const chatId = telegramChatId.value();

    if (!botToken || !chatId) {
      res.json({ ok: true, description: "Telegram credentials not configured" });
      return;
    }

    const { text, parse_mode, file, filename, caption } = req.body;

    try {
      if (file && filename) {
        const tUrl = `https://api.telegram.org/bot${botToken}/sendDocument`;
        const blobData = Buffer.from(file, "base64");
        const formData = new FormData();
        formData.append("chat_id", chatId);
        formData.append("caption", caption || "");
        const fileBlob = new Blob([blobData], { type: "application/octet-stream" });
        formData.append("document", fileBlob, filename);
        const response = await fetch(tUrl, { method: "POST", body: formData });
        const result = await response.json();
        res.json(result);
      } else {
        const tUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
        const response = await fetch(tUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: chatId, text, parse_mode: parse_mode || "HTML" }),
        });
        const result = await response.json();
        res.json(result);
      }
    } catch (err) {
      console.error("Telegram delivery failure:", err);
      res.status(500).json({ ok: false, description: err.message });
    }
  }
);
