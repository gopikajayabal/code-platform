import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getProblems = async (_req: Request, res: Response) => {
  try {
    const problems = await prisma.problem.findMany({
      orderBy: { createdAt: "desc" },
    });

    return res.json({
      problems,
      pagination: {
        total: problems.length,
        page: 1,
        pages: 1,
      },
    });
  } catch {
    return res.status(500).json({ error: "Failed to fetch problems" });
  }
};

export const getProblemBySlug = async (req: Request, res: Response) => {
  try {
    const slug = String(req.params.slug);

    const problem = await prisma.problem.findUnique({
      where: { slug },
    });

    if (!problem) {
      return res.status(404).json({ error: "Problem not found" });
    }

    return res.json(problem);
  } catch {
    return res.status(500).json({ error: "Failed to fetch problem" });
  }
};

export const createProblem = async (req: Request, res: Response) => {
  try {
    const { title, slug, description, difficulty, language, topic } = req.body;

    const problem = await prisma.problem.create({
      data: {
        title,
        slug,
        description,
        difficulty,
        language: language || "GENERAL",
        topic: topic || "General",
        timeLimit: 2,
        memoryLimit: 256,
      },
    });

    return res.status(201).json({
      success: true,
      problem,
    });
  } catch {
    return res.status(400).json({
      success: false,
      message: "Problem create failed. Slug may already exist.",
    });
  }
};

export const updateProblem = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const { title, slug, description, difficulty, language, topic } = req.body;

    const problem = await prisma.problem.update({
      where: { id: id },
      data: {
        title,
        slug,
        description,
        difficulty,
        language,
        topic,
      },
    });

    return res.json({
      success: true,
      problem,
    });
  } catch {
    return res.status(400).json({
      success: false,
      message: "Problem update failed.",
    });
  }
};

export const deleteProblem = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);

    await prisma.problem.delete({
      where: { id: id },
    });

    return res.json({
      success: true,
      message: "Problem deleted successfully",
    });
  } catch {
    return res.status(400).json({
      success: false,
      message: "Problem delete failed.",
    });
  }
};