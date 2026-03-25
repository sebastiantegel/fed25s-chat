import bcrypt from "bcryptjs";
import type { LoginRequest } from "../models/requests/loginRequest.mjs";
import User, { convertToDto } from "../models/userSchema.mjs";

export const loginUser = async (req: LoginRequest) => {
  const foundUser = await User.findOne({ email: req.email });

  if (!foundUser) {
    return null;
  }

  const success = await bcrypt.compare(req.password, foundUser.password);

  if (success) {
    return convertToDto(foundUser);
  } else {
    return null;
  }
};
