import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import { executeCode } from "../services/judge.service";

const prisma = new PrismaClient();

type TokenPayload = {
  id?: string;
  userId?: string;
  role?: string;
};

type SubmissionMode = "run" | "submit";

function getUserIdFromRequest(req: Request): string | null {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  try {
    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "secret"
    ) as TokenPayload;

    return decoded.userId || decoded.id || null;
  } catch {
    return null;
  }
}

function normalizeOutput(value: string | null | undefined): string {
  return (value || "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .trim();
}

function getJudgeOutput(result: {
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  message: string | null;
}): string {
  return (
    result.stdout ||
    result.compile_output ||
    result.stderr ||
    result.message ||
    "No output"
  );
}

function getExecutionError(result: {
  stderr: string | null;
  compile_output: string | null;
  message: string | null;
}): string | null {
  return (
    result.compile_output ||
    result.stderr ||
    result.message ||
    null
  );
}
function isFrontendLanguage(language: string): boolean {
  const normalizedLanguage = language.trim().toLowerCase();

  return (
    normalizedLanguage === "html" ||
    normalizedLanguage === "css"
  );
}

function validateFrontendCode(
  language: string,
  code: string
): {
  accepted: boolean;
  message: string;
} {
  const normalizedLanguage = language.trim().toLowerCase();
  const normalizedCode = code.trim();

  if (normalizedLanguage === "html") {
    const hasHtmlStructure =
      normalizedCode.includes("<html") ||
      normalizedCode.includes("<!DOCTYPE html");

    const hasBody =
      normalizedCode.includes("<body") &&
      normalizedCode.includes("</body>");

    if (!hasHtmlStructure || !hasBody) {
      return {
        accepted: false,
        message:
          "HTML must include a valid HTML structure and body element.",
      };
    }

    return {
      accepted: true,
      message: "HTML validation passed.",
    };
  }

  if (normalizedLanguage === "css") {
    const hasSelector =
      normalizedCode.includes("{") &&
      normalizedCode.includes("}");

    const hasProperty =
      normalizedCode.includes(":") &&
      normalizedCode.includes(";");

    if (!hasSelector || !hasProperty) {
      return {
        accepted: false,
        message:
          "CSS must include at least one selector and one valid property.",
      };
    }

    return {
      accepted: true,
      message: "CSS validation passed.",
    };
  }

  return {
    accepted: false,
    message: "Unsupported frontend language.",
  };
}
export const createSubmission = async (
  req: Request,
  res: Response
) => {
  try {
    const finalUserId = getUserIdFromRequest(req);

    if (!finalUserId) {
      return res.status(401).json({
        success: false,
        error: "Invalid or missing authentication token",
      });
    }
    const currentUser = await prisma.user.findUnique({
  where: {
    id: finalUserId,
  },
  select: {
    id: true,
  },
});

if (!currentUser) {
  return res.status(401).json({
    success: false,
    error: "Your login session is invalid. Please login again.",
  });
}
    const {
      problemId,
      language,
      code,
      stdin = "",
      mode = "run",
    } = req.body as {
      problemId: string;
      language: string;
      code: string;
      stdin?: string;
      mode?: SubmissionMode;
    };

    if (!problemId) {
      return res.status(400).json({
        success: false,
        error: "Problem ID is required",
      });
    }

    if (!language || typeof language !== "string") {
      return res.status(400).json({
        success: false,
        error: "Programming language is required",
      });
    }

    if (!code || typeof code !== "string") {
      return res.status(400).json({
        success: false,
        error: "Source code is required",
      });
    }

    const problem = await prisma.problem.findUnique({
      where: {
        id: problemId,
      },
      include: {
        testCases: {
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
    if (isFrontendLanguage(language)) {
  const validation = validateFrontendCode(language, code);

  const finalStatus = validation.accepted
    ? "ACCEPTED"
    : "WRONG_ANSWER";

  const previousAcceptedSubmission =
    await prisma.submission.findFirst({
      where: {
        userId: finalUserId,
        problemId,
        status: "ACCEPTED",
      },
      select: {
        id: true,
      },
    });

  const submission = await prisma.$transaction(
    async (tx) => {
      const createdSubmission =
        await tx.submission.create({
          data: {
            userId: finalUserId,
            problemId,
            language,
            code,
            output: validation.message,
            error: validation.accepted
              ? null
              : validation.message,
            status: finalStatus,
            passedTests: validation.accepted ? 1 : 0,
            totalTests: 1,
            executionTime: 0,
            memoryUsed: 0,
          },
        });

      if (
        finalStatus === "ACCEPTED" &&
        !previousAcceptedSubmission
      ) {
        await tx.problem.update({
          where: {
            id: problemId,
          },
          data: {
            solvedCount: {
              increment: 1,
            },
          },
        });
      }

      return createdSubmission;
    }
  );

  return res.status(201).json({
    success: true,
    message: validation.message,
    submission,
    execution: {
      output: validation.message,
      status: finalStatus,
      passedTests: validation.accepted ? 1 : 0,
      totalTests: 1,
      time: 0,
      memory: 0,
    },
  });
}
    if (mode === "submit") {
      if (problem.testCases.length === 0) {
        return res.status(400).json({
          success: false,
          error: "No test cases are available for this problem",
        });
      }

      let passedTests = 0;
      let finalOutput = "";
      let finalError: string | null = null;
      let finalStatus = "WRONG_ANSWER";
      let totalExecutionTime = 0;
      let maximumMemory = 0;

      for (const testCase of problem.testCases) {
        const judgeResult = await executeCode({
          sourceCode: code,
          language,
          stdin: testCase.input,
        });

        finalOutput = getJudgeOutput(judgeResult);

        if (judgeResult.time) {
          totalExecutionTime += Number(judgeResult.time) || 0;
        }

        if (judgeResult.memory) {
          maximumMemory = Math.max(
            maximumMemory,
            judgeResult.memory
          );
        }

        if (judgeResult.status.id !== 3) {
          finalStatus = judgeResult.status.description
            .toUpperCase()
            .replace(/\s+/g, "_");

          finalError = getExecutionError(judgeResult);
          break;
        }

        const actualOutput = normalizeOutput(
          judgeResult.stdout
        );

        const expectedOutput = normalizeOutput(
          testCase.expectedOutput
        );

        if (actualOutput === expectedOutput) {
          passedTests++;
        } else {
          finalStatus = "WRONG_ANSWER";
          break;
        }
      }

      if (passedTests === problem.testCases.length) {
        finalStatus = "ACCEPTED";
      }

      const previousAcceptedSubmission =
        await prisma.submission.findFirst({
          where: {
            userId: finalUserId,
            problemId,
            status: "ACCEPTED",
          },
          select: {
            id: true,
          },
        });

      const submission = await prisma.$transaction(
        async (tx) => {
          const createdSubmission =
            await tx.submission.create({
              data: {
                userId: finalUserId,
                problemId,
                language,
                code,
                output: finalOutput,
                error: finalError,
                status: finalStatus,
                passedTests,
                totalTests: problem.testCases.length,
                executionTime: totalExecutionTime,
                memoryUsed:
                  maximumMemory > 0
                    ? maximumMemory
                    : null,
              },
            });

          if (
            finalStatus === "ACCEPTED" &&
            !previousAcceptedSubmission
          ) {
            await tx.problem.update({
              where: {
                id: problemId,
              },
              data: {
                solvedCount: {
                  increment: 1,
                },
              },
            });
          }

          return createdSubmission;
        }
      );

      return res.status(201).json({
        success: true,
        message:
          finalStatus === "ACCEPTED"
            ? "All test cases passed"
            : "Submission evaluated",
        submission,
        execution: {
          output: finalOutput,
          error: finalError,
          status: finalStatus,
          passedTests,
          totalTests: problem.testCases.length,
          time: totalExecutionTime,
          memory:
            maximumMemory > 0 ? maximumMemory : null,
        },
      });
    }

    const publicTestCase = problem.testCases.find(
      (testCase) => !testCase.isHidden
    );

    const inputToUse =
      typeof stdin === "string" && stdin.trim().length > 0
        ? stdin
        : publicTestCase?.input || "";

    const judgeResult = await executeCode({
      sourceCode: code,
      language,
      stdin: inputToUse,
    });

    const finalOutput = getJudgeOutput(judgeResult);
    const executionError = getExecutionError(judgeResult);

    let runStatus = judgeResult.status.description;
    let passedTests = 0;
    let totalTests = 0;

    if (
      judgeResult.status.id === 3 &&
      publicTestCase &&
      inputToUse === publicTestCase.input
    ) {
      totalTests = 1;

      const actualOutput = normalizeOutput(
        judgeResult.stdout
      );

      const expectedOutput = normalizeOutput(
        publicTestCase.expectedOutput
      );

      if (actualOutput === expectedOutput) {
        runStatus = "ACCEPTED";
        passedTests = 1;
      } else {
        runStatus = "WRONG_ANSWER";
      }
    }

    const submission = await prisma.submission.create({
      data: {
        userId: finalUserId,
        problemId,
        language,
        code,
        output: finalOutput,
        error: executionError,
        status: runStatus,
        passedTests,
        totalTests,
        executionTime: judgeResult.time
          ? Number(judgeResult.time)
          : null,
        memoryUsed: judgeResult.memory,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Code executed successfully",
      submission,
      execution: {
        output: finalOutput,
        stdout: judgeResult.stdout,
        stderr: judgeResult.stderr,
        compileOutput: judgeResult.compile_output,
        message: judgeResult.message,
        statusId: judgeResult.status.id,
        status: runStatus,
        passedTests,
        totalTests,
        time: judgeResult.time,
        memory: judgeResult.memory,
        inputUsed: inputToUse,
      },
    });
  } catch (error: any) {
    console.error("Submission execution error:", error);

    return res.status(500).json({
      success: false,
      error:
        error.message ||
        "Code execution or submission failed",
    });
  }
};

export const getMySubmissions = async (
  req: Request,
  res: Response
) => {
  try {
    const finalUserId = getUserIdFromRequest(req);

    if (!finalUserId) {
      return res.status(401).json({
        success: false,
        error: "Invalid or missing authentication token",
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
      error:
        error.message || "Failed to fetch submissions",
    });
  }
};

export const getLeaderboard = async (
  _req: Request,
  res: Response
) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        submissions: {
          where: {
            status: "ACCEPTED",
          },
        },
      },
    });

    const leaderboard = users
      .map((user) => {
        const uniqueProblems = new Set(
          user.submissions.map(
            (submission) => submission.problemId
          )
        );

        return {
          userId: user.id,
          username: user.username,
          solved: uniqueProblems.size,
          acceptedSubmissions: user.submissions.length,
        };
      })
      .sort((a, b) => {
        if (b.solved !== a.solved) {
          return b.solved - a.solved;
        }

        return (
          a.acceptedSubmissions -
          b.acceptedSubmissions
        );
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
      error:
        error.message || "Failed to load leaderboard",
    });
  }
};

export const getMyStats = async (
  req: Request,
  res: Response
) => {
  try {
    const finalUserId = getUserIdFromRequest(req);

    if (!finalUserId) {
      return res.status(401).json({
        success: false,
        error: "Invalid or missing authentication token",
      });
    }

    const totalProblems = await prisma.problem.count();

    const acceptedSubmissions =
      await prisma.submission.findMany({
        where: {
          userId: finalUserId,
          status: "ACCEPTED",
        },
        select: {
          problemId: true,
        },
      });

    const totalSubmissions =
      await prisma.submission.count({
        where: {
          userId: finalUserId,
        },
      });

    const solvedProblems = new Set(
      acceptedSubmissions.map(
        (submission) => submission.problemId
      )
    ).size;

    return res.json({
      success: true,
      totalProblems,
      solvedProblems,
      submissions: totalSubmissions,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error:
        error.message ||
        "Failed to load dashboard stats",
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
      error:
        error.message ||
        "Failed to load admin submissions",
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
        error: "Invalid or missing authentication token",
      });
    }

    const languages = [
      "C",
      "C++",
      "Java",
      "Python",
      "JavaScript",
    ];

    const progress = await Promise.all(
      languages.map(async (language) => {
        const total = await prisma.problem.count({
          where: {
            language,
          },
        });

        const submissions =
          await prisma.submission.findMany({
            where: {
              userId: finalUserId,
              status: "ACCEPTED",
              problem: {
                language,
              },
            },
            select: {
              problemId: true,
            },
          });

        const solved = new Set(
          submissions.map(
            (submission) => submission.problemId
          )
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
      error:
        error.message ||
        "Failed to load language progress",
    });
  }
}; 