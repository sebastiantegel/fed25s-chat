import express, { json } from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import cors from "cors";
import type { Message } from "@sebastiantegel/edutypes";
import { config } from "dotenv";
import mongoose from "mongoose";
import Chat from "./models/chatSchema.mjs";
import registerRouter from "./routes/register.mjs";
import { loginRouter } from "./routes/login.mjs";
import cookieParser from "cookie-parser";
import cookie from "cookie";
import jwt from "jsonwebtoken";
import type { UserDto } from "./models/userDto.mjs";

// Gör det möjligt för oss att hämta värden från .env-filen
config();

const mongoUrl = process.env.MONGO_URL;
const port = process.env.PORT || 3000;

if (!mongoUrl)
  throw new Error("Could not find connection string in the env file");

const allowedOrigins = [
  "https://localhost:5173",
  "https://fed25s-chat-cbgzhhgncrhjesg8.swedencentral-01.azurewebsites.net", // add your frontend URL if hosted
];

const app = express();

app.use((req, res, next) => {
  console.log("Origin:", req.headers.origin);
  next();
});

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  }),
);
app.options(
  "*",
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(json());

app.use("/register", registerRouter);
app.use("/login", loginRouter);

const server = createServer(app);

const io = new Server(server, {
  cors: { origin: allowedOrigins, credentials: true, methods: ["GET", "POST"] },
  cookie: true,
});

app.get("/ping", (_, res) => {
  res.status(200).json({ message: "Alive" });
});

io.on("connection", async (socket) => {
  console.log("A user connected:", socket.id);

  // Hitta alla cookies
  const cookies = cookie.parse(socket.handshake.headers.cookie || "");

  // Plocka ut vår cookie (login)
  const loginCookie = cookies.login;

  console.log("Cookie:", loginCookie);

  socket.on("sendMessage", async (theMessage: Message, room: string) => {
    // Lagra meddelandet i en lista eller databas
    // Sök efter chatten i listan med chattar
    // const foundChat = chats.find((c) => c.name === room);
    const foundChat = await Chat.findOne({ name: room });

    // Om chatten hittades
    if (foundChat && loginCookie) {
      // Avkoda vår cookie för att då tillbaka användaren
      const userDto = jwt.decode(loginCookie) as UserDto;

      // Uppdatera meddelandet med den inloggade användaren
      theMessage.from = userDto.username;

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
