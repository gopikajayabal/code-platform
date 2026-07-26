const JUDGE0_URL =
  process.env.JUDGE0_URL || "https://ce.judge0.com";

export const languageIds: Record<string, number> = {
  c: 103,
  cpp: 105,
  "c++": 105,
  java: 91,
  javascript: 93,
  js: 93,
  python: 92,
  py: 92,
  typescript: 94,
  ts: 94,
};

export interface ExecuteCodeInput {
  sourceCode: string;
  language: string;
  stdin?: string;
}

export interface Judge0Result {
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  message: string | null;
  status: {
    id: number;
    description: string;
  };
  time: string | null;
  memory: number | null;
}

export async function executeCode(
  input: ExecuteCodeInput
): Promise<Judge0Result> {
  const normalizedLanguage = input.language
    .trim()
    .toLowerCase();

  const languageId = languageIds[normalizedLanguage];

  if (!languageId) {
    throw new Error(
      `Unsupported language: ${input.language}`
    );
  }

  const response = await fetch(
    `${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source_code: input.sourceCode,
        language_id: languageId,
        stdin: input.stdin || "",
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Judge0 submission failed: ${response.status} ${errorText}`
    );
  }

  return (await response.json()) as Judge0Result;
}