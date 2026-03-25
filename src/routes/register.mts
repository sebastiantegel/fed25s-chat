import express from "express";
import type { RegisterRequest } from "../models/requests/registerRequest.mjs";
import { createUser } from "../controllers/registerController.mjs";

const registerRouter = express.Router();

// http://localhost:3000/register - POST
registerRouter.post("/", async (req, res) => {
  try {
    const { username, email, password }: RegisterRequest = req.body;

    // Validering
    if (!username) {
      return res.status(400).json({ message: "Missing username in body" });
    }

    if (username.length < 2) {
      return res
        .status(400)
        .json({ message: "Username must contain at least 2 characters" });
    }

    // För mer avancerad validering kan Regular Expresssion användas (regexp)
    // Eller använd npm-paketet zod.

    // Skapa användaren
    const userDto = await createUser({ username, email, password });

    // Skicka tillbaka ett resultat
    res.status(200).json(userDto);
  } catch (error) {
    console.error(error);
    res.status(500).json(JSON.stringify(error));
  }
});

export default registerRouter;
