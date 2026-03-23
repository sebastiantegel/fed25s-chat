import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import cors from "cors";
import type { Message } from "@sebastiantegel/edutypes";
import { config } from "dotenv";
import mongoose from "mongoose";
import Chat from "./models/chatSchema.mjs";

// Gör det möjligt för oss att hämta värden från .env-filen
config();

const mongoUrl = process.env.MONGO_URL;
const port = process.env.PORT || 3000;

if (!mongoUrl)
  throw new Error("Could not find connection string in the env file");

const app = express();
app.use(
  cors({
    origin: "http://localhost:5173",
  }),
);

const server = createServer(app);

const io = new Server(server, { cors: { origin: "*" } });

// const rooms = ["Next.js", "express", "socket.io"];
// const chats: Chat[] = [];

app.get("/ping", (_, res) => {
  res.status(200).json({ message: "Alive" });
});

io.on("connection", async (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("sendMessage", async (theMessage: Message, room: string) => {
    // Lagra meddelandet i en lista eller databas
    // Sök efter chatten i listan med chattar
    // const foundChat = chats.find((c) => c.name === room);
    const foundChat = await Chat.findOne({ name: room });

    // Om chatten hittades
    if (foundChat) {
      // Lägg till meddelandet i chatten
      foundChat.messages.push(theMessage);

      // Spara ändringen i databasen
      await foundChat.save();
    } else {
      console.error("Could not find chat:", room);
    }

    // console.log("Got message from client:", theMessage);
    console.log(foundChat);

    // Skickar till alla
    // io.emit("newMessage", theMessage);

    // Skickar bara till rummet room
    io.to(room).emit("newMessage", theMessage);
  });

  socket.on("joinRoom", async (room: string) => {
    // Lägg till webbläsaren (personen) i det rum som valdes
    // i webbläsaren
    socket.join(room);

    // Skicka all historik till webbläsaren för den valda chatten
    // const foundChat = chats.find((c) => c.name === room);
    const foundChat = await Chat.findOne({ name: room });

    if (foundChat) {
      socket.emit("chatHistory", foundChat.messages);
    }
  });

  // Skicka listan med rum till webbläsaren
  const chats = await Chat.find();

  // Loopa igenom listan av chattar. Returnera namnet på varje chat och
  // lagra det i en ny lista (rooms)
  const rooms = chats.map((chat) => chat.name);

  // Skicka alla chatnamn till frontend
  socket.emit("roomList", rooms);
});

server.listen(port, async () => {
  try {
    await mongoose.connect(mongoUrl);
  } catch (error) {
    console.error("Could not connect to database:", error);
  }
  console.log("Api is running on port 3000");
});
