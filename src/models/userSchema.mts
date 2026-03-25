import { model, Schema, type InferSchemaType } from "mongoose";
import type { UserDto } from "./userDto.mjs";

const userSchema = new Schema({
  username: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
});

const User = model("user", userSchema);

type UserDbType = InferSchemaType<typeof userSchema>;

export const convertToDto = (dataFromDb: UserDbType): UserDto => {
  return {
    username: dataFromDb.username,
    email: dataFromDb.email,
  } satisfies UserDto;
};

export default User;
