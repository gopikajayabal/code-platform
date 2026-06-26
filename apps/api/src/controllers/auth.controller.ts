import { Request, Response } from "express";
import bcrypt from "bcryptjs";

import {
  registerUser,
  findUserByEmail
} from "../services/auth.service";

import { generateToken } from "../utils/jwt";

function cleanUser(user: any) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
    createdAt: user.createdAt,
  };
}

export const register = async (
  req: Request,
  res: Response
) => {
  try {
    const { email, username, password } = req.body;

    const user = await registerUser(
      email,
      username,
      password
    );

    const token = generateToken(user.id);

    return res.status(201).json({
      success: true,
      token,
      user: cleanUser(user),
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const login = async (
  req: Request,
  res: Response
) => {
  try {
    const { email, password } = req.body;

    const user = await findUserByEmail(email);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    const validPassword =
      await bcrypt.compare(
        password,
        user.passwordHash
      );

    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    const token = generateToken(user.id);

    return res.json({
      success: true,
      token,
      user: cleanUser(user),
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
};
