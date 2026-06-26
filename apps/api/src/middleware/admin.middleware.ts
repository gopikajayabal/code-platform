import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type TokenPayload = {
  id?: string;
  userId?: string;
};

export const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "secret"
    ) as TokenPayload;

    const userId = decoded.userId || decoded.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Admin access only",
      });
    }

    next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }
};