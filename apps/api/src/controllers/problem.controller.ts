import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type TestCaseInput = {
  input: string;
  expectedOutput: string;
  isHidden?: boolean;
  order?: number;
};

export const getProblems = async (_req: Request, res: Response) => {
  try {
    const problems = await prisma.problem.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        testCases: {
          where: {
            isHidden: false,
          },
          orderBy: {
            order: "asc",
          },
        },
      },
    });

    return res.json({
      success: true,
      problems,
      pagination: {
        total: problems.length,
        page: 1,
        pages: 1,
      },
    });
  } catch (error) {
    console.error("Fetch problems error:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to fetch problems",
    });
  }
};

export const getProblemBySlug = async (
  req: Request,
  res: Response
) => {
  try {
    const slug = String(req.params.slug);

    const problem = await prisma.problem.findUnique({
      where: {
        slug,
      },
      include: {
        testCases: {
          where: {
            isHidden: false,
          },
          orderBy: {
            order: "asc",
          },
        },
      },
    });

    if (!problem) {
      return res.status(404).json({
        success: false,
        error: "Problem not found",
      });
    }

    return res.json({
      success: true,
      problem,
    });
  } catch (error) {
    console.error("Fetch problem error:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to fetch problem",
    });
  }
};

export const createProblem = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      title,
      slug,
      description,
      difficulty,
      language,
      topic,
      timeLimit,
      memoryLimit,
      testCases = [],
    } = req.body as {
      title: string;
      slug: string;
      description: string;
      difficulty: "EASY" | "MEDIUM" | "HARD";
      language?: string;
      topic?: string;
      timeLimit?: number;
      memoryLimit?: number;
      testCases?: TestCaseInput[];
    };

    if (!title || !slug || !description || !difficulty) {
      return res.status(400).json({
        success: false,
        message:
          "Title, slug, description and difficulty are required.",
      });
    }

    if (!Array.isArray(testCases) || testCases.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one test case is required.",
      });
    }

    const invalidTestCase = testCases.some(
      (testCase) =>
        typeof testCase.input !== "string" ||
        typeof testCase.expectedOutput !== "string"
    );

    if (invalidTestCase) {
      return res.status(400).json({
        success: false,
        message:
          "Every test case must contain input and expectedOutput.",
      });
    }

    const problem = await prisma.problem.create({
      data: {
        title: title.trim(),
        slug: slug.trim().toLowerCase(),
        description,
        difficulty,
        language: language || "GENERAL",
        topic: topic || "General",
        timeLimit: Number(timeLimit) || 2,
        memoryLimit: Number(memoryLimit) || 256,

        testCases: {
          create: testCases.map((testCase, index) => ({
            input: testCase.input,
            expectedOutput: testCase.expectedOutput,
            isHidden: testCase.isHidden ?? true,
            order: testCase.order ?? index + 1,
          })),
        },
      },
      include: {
        testCases: {
          orderBy: {
            order: "asc",
          },
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: "Problem created successfully",
      problem,
    });
  } catch (error: any) {
    console.error("Create problem error:", error);

    return res.status(400).json({
      success: false,
      message:
        error?.code === "P2002"
          ? "Problem slug already exists."
          : error?.message || "Problem creation failed.",
    });
  }
};

export const updateProblem = async (
  req: Request,
  res: Response
) => {
  try {
    const id = String(req.params.id);

    const {
      title,
      slug,
      description,
      difficulty,
      language,
      topic,
      timeLimit,
      memoryLimit,
      testCases,
    } = req.body as {
      title?: string;
      slug?: string;
      description?: string;
      difficulty?: "EASY" | "MEDIUM" | "HARD";
      language?: string;
      topic?: string;
      timeLimit?: number;
      memoryLimit?: number;
      testCases?: TestCaseInput[];
    };

    const problem = await prisma.$transaction(async (tx) => {
      if (Array.isArray(testCases)) {
        await tx.testCase.deleteMany({
          where: {
            problemId: id,
          },
        });
      }

      return tx.problem.update({
        where: {
          id,
        },
        data: {
          ...(title !== undefined && {
            title: title.trim(),
          }),

          ...(slug !== undefined && {
            slug: slug.trim().toLowerCase(),
          }),

          ...(description !== undefined && {
            description,
          }),

          ...(difficulty !== undefined && {
            difficulty,
          }),

          ...(language !== undefined && {
            language,
          }),

          ...(topic !== undefined && {
            topic,
          }),

          ...(timeLimit !== undefined && {
            timeLimit: Number(timeLimit),
          }),

          ...(memoryLimit !== undefined && {
            memoryLimit: Number(memoryLimit),
          }),

          ...(Array.isArray(testCases) && {
            testCases: {
              create: testCases.map((testCase, index) => ({
                input: testCase.input,
                expectedOutput: testCase.expectedOutput,
                isHidden: testCase.isHidden ?? true,
                order: testCase.order ?? index + 1,
              })),
            },
          }),
        },
        include: {
          testCases: {
            orderBy: {
              order: "asc",
            },
          },
        },
      });
    });

    return res.json({
      success: true,
      message: "Problem updated successfully",
      problem,
    });
  } catch (error: any) {
    console.error("Update problem error:", error);

    return res.status(400).json({
      success: false,
      message:
        error?.code === "P2002"
          ? "Problem slug already exists."
          : error?.message || "Problem update failed.",
    });
  }
};

export const deleteProblem = async (
  req: Request,
  res: Response
) => {
  try {
    const id = String(req.params.id);

    await prisma.problem.delete({
      where: {
        id,
      },
    });

    return res.json({
      success: true,
      message: "Problem deleted successfully",
    });
  } catch (error: any) {
    console.error("Delete problem error:", error);

    return res.status(400).json({
      success: false,
      message:
        error?.message || "Problem delete failed.",
    });
  }
};