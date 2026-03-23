import { model, Schema } from "mongoose";

const messageSchema = new Schema(
  {
    from: { type: String, required: true },
    message: { type: String, required: true },
  },
  {
    timestamps: { createdAt: "time", updatedAt: false },
  },
);

const chatSchema = new Schema({
  name: { type: String, required: true },
  messages: { type: [messageSchema], required: true },
});

const Chat = model("chat", chatSchema);

export default Chat;
