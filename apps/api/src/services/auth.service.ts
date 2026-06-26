import bcrypt from "bcryptjs";
import { prisma } from "../utils/prisma";

export const registerUser = async (
  email: string,
  username: string,
  password: string
) => {
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { username }]
    }
  });

  if (existingUser) {
    throw new Error("User already exists");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      username,
      passwordHash
    }
  });

  return user;
};

export const findUserByEmail = async (email: string) => {
  return prisma.user.findUnique({
    where: { email }
  });
};