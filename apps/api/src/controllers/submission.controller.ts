import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

type TokenPayload = {
  id?: string;
  userId?: string;
  role?: string;
};

function getUserIdFromRequest(req: Request) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.split(" ")[1];

  const decoded = jwt.verify(
    token,
    process.env.JWT_SECRET || "secret"
  ) as TokenPayload;

  return decoded.userId || decoded.id || null;
}

export const createSubmission = async (req: Request, res: Response) => {
  try {
    const finalUserId = getUserIdFromRequest(req);

    if (!finalUserId) {
      return res.status(401).json({
        success: false,
        error: "No token provided",
      });
    }

    const { problemId, language, code, output } = req.body;

    const submission = await prisma.submission.create({
      data: {
        userId: finalUserId,
        problemId,
        language,
        code,
        output,
        status: "SAVED",
      },
    });

    return res.status(201).json({
      success: true,
      submission,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || "Submission save failed",
    });
  }
};

export const getMySubmissions = async (req: Request, res: Response) => {
  try {
    const finalUserId = getUserIdFromRequest(req);

    if (!finalUserId) {
      return res.status(401).json({
        success: false,
        error: "No token provided",
      });
    }

    const submissions = await prisma.submission.findMany({
      where: {
        userId: finalUserId,
      },
      include: {
        problem: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json({
      success: true,
      submissions,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch submissions",
    });
  }
};

export const getLeaderboard = async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        submissions: true,
      },
    });

    const leaderboard = users
      .map((user) => {
        const uniqueProblems = new Set(
          user.submissions.map((submission) => submission.problemId)
        );

        return {
          userId: user.id,
          username: user.username,
          solved: uniqueProblems.size,
          submissions: user.submissions.length,
        };
      })
      .sort((a, b) => {
        if (b.solved !== a.solved) return b.solved - a.solved;
        return b.submissions - a.submissions;
      })
      .map((user, index) => ({
        rank: index + 1,
        ...user,
      }));

    return res.json({
      success: true,
      leaderboard,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to load leaderboard",
    });
  }
};

export const getMyStats = async (req: Request, res: Response) => {
  try {
    const finalUserId = getUserIdFromRequest(req);

    if (!finalUserId) {
      return res.status(401).json({
        success: false,
        error: "No token provided",
      });
    }

    const totalProblems = await prisma.problem.count();

    const submissions = await prisma.submission.findMany({
      where: {
        userId: finalUserId,
      },
      select: {
        problemId: true,
      },
    });

    const solvedProblems = new Set(
      submissions.map((submission) => submission.problemId)
    ).size;

    return res.json({
      success: true,
      totalProblems,
      solvedProblems,
      submissions: submissions.length,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to load dashboard stats",
    });
  }
};

export const getAllSubmissionsForAdmin = async (
  _req: Request,
  res: Response
) => {
  try {
    const submissions = await prisma.submission.findMany({
      include: {
        problem: true,
        user: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json({
      success: true,
      submissions,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to load admin submissions",
    });
  }
};

export const getMyLanguageProgress = async (
  req: Request,
  res: Response
) => {
  try {
    const finalUserId = getUserIdFromRequest(req);

    if (!finalUserId) {
      return res.status(401).json({
        success: false,
        error: "No token provided",
      });
    }

    const languages = ["C", "C++", "Java", "Python", "HTML"];

    const progress = await Promise.all(
      languages.map(async (language) => {
        const total = await prisma.problem.count({
          where: { language },
        });

        const submissions = await prisma.submission.findMany({
          where: {
            userId: finalUserId,
            problem: {
              language,
            },
          },
          select: {
            problemId: true,
          },
        });

        const solved = new Set(
          submissions.map((submission) => submission.problemId)
        ).size;

        return {
          language,
          total,
          solved,
          completed: total > 0 && solved >= total,
        };
      })
    );

    return res.json({
      success: true,
      progress,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to load language progress",
    });
  }
};