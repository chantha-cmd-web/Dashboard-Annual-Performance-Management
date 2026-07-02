import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import * as dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parsing middleware
  app.use(express.json({ limit: "15mb" }));
  app.use(express.urlencoded({ extended: true, limit: "15mb" }));

  // API 1: Fetch employees sheet data CSV (MasterList)
  app.get("/api/sheet1", async (req, res) => {
    const sheetUrl = `https://docs.google.com/spreadsheets/d/e/2PACX-1vTO68GX9WFErMXR7GxUbaAybv0Vu-Cuia482ACsE8LDVOy_g_fAmvuEG7Y6WTSAII_PG521XZoBgBM_/pub?gid=1500996284&single=true&output=csv&_cb=${Date.now()}`;
    try {
      const response = await fetch(sheetUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.text();
      res.setHeader("Content-Type", "text/plain");
      res.send(data);
    } catch (err: any) {
      console.error("Error fetching sheet1 proxy:", err);
      // Fallback: If URL doesn't resolve/fails, send a helpful error message
      res.status(500).send(`Error fetching sheet1: ${err.message}`);
    }
  });

  // API 2: Fetch self scores sheet data CSV
  app.get("/api/sheet2", async (req, res) => {
    const gid = req.query.gid || "607488980";
    const sheetId = "1PtOX76nXMJFZ7ymlyrmdYMlPSVU6p614b5Azx1MBkMk";
    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}&_cb=${Date.now()}`;
    try {
      const response = await fetch(csvUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.text();
      res.setHeader("Content-Type", "text/plain");
      res.send(data);
    } catch (err: any) {
      console.error("Error fetching sheet2 proxy:", err);
      res.status(500).send(`Error fetching sheet2: ${err.message}`);
    }
  });

  // API 3: Send Telegram alert notification (using bot credentials from .env)
  app.post("/api/telegram", async (req, res) => {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    // Use default test credentials if not configured in .env, or report missing config
    if (!botToken || !chatId) {
      console.log("Telegram credentials NOT configured in .env. Mocking response.");
      return res.json({ ok: true, description: "Notification logged to server console since botToken/chatId is unconfigured" });
    }

    const { text, parse_mode, file, filename, caption } = req.body;

    try {
      if (file && filename) {
        // Send document
        const tUrl = `https://api.telegram.org/bot${botToken}/sendDocument`;
        const blobData = Buffer.from(file, "base64");
        const formData = new FormData();
        formData.append("chat_id", chatId);
        formData.append("caption", caption || "");
        
        // Convert Buffer to standard Blob for compliant FormData upload
        const fileBlob = new Blob([blobData], { type: "application/octet-stream" });
        formData.append("document", fileBlob, filename);

        const response = await fetch(tUrl, {
          method: "POST",
          body: formData,
        });
        const result = await response.json();
        return res.json(result);
      } else {
        // Send simple text message
        const tUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
        const response = await fetch(tUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: text,
            parse_mode: parse_mode || "HTML",
          }),
        });
        const result = await response.json();
        return res.json(result);
      }
    } catch (err: any) {
      console.error("Telegram delivery failure:", err);
      return res.status(500).json({ ok: false, description: err.message });
    }
  });

  // Healthcheck endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // SPA fallback
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
