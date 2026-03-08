import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    maxHttpBufferSize: 1e8, // 100 MB
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const PORT = 3000;

  // In-memory message store (for demo purposes - in real app use DB)
  let messages: any[] = [];

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Send existing messages to the newly connected user
    socket.emit("initial_messages", messages);

    socket.on("send_message", (message) => {
      const newMessage = {
        ...message,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        isRead: false
      };
      messages.push(newMessage);
      // Broadcast to everyone
      io.emit("new_message", newMessage);
    });

    socket.on("mark_as_read", (messageId) => {
      messages = messages.map(m => m.id === messageId ? { ...m, isRead: true } : m);
      io.emit("message_updated", messageId);
    });

    socket.on("send_notification", (notification) => {
      // Broadcast notification to all clients
      // The client-side logic will filter by userId to show only relevant notifications
      io.emit("new_notification", notification);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  // API routes
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
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
