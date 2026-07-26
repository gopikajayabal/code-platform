import Link from "next/link";
import CodeEditor from "../../components/editor/CodeEditor";

type PublicTestCase = {
  id: string;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
  order: number;
};

type Problem = {
  id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  language: string;
  topic: string;
  solvedCount: number;
  totalCount: number;
  timeLimit: number;
  memoryLimit: number;
  testCases?: PublicTestCase[];
};

type ProblemResponse = {
  success?: boolean;
  problem?: Problem;
  error?: string;
};

async function getProblem(
  slug: string
): Promise<Problem | null> {
  try {
    const response = await fetch(
      `http://localhost:5000/api/problems/${slug}`,
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return null;
    }

    const data =
      (await response.json()) as ProblemResponse | Problem;

    if ("problem" in data && data.problem) {
      return data.problem;
    }

    if ("id" in data) {
      return data as Problem;
    }

    return null;
  } catch (error) {
    console.error("Problem fetch failed:", error);
    return null;
  }
}

export default async function ProblemDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const problem = await getProblem(slug);

  if (!problem) {
    return (
      <main style={pageStyle}>
        <h1>Problem Not Found</h1>

        <p style={{ color: "#94a3b8" }}>
          The requested problem could not be loaded.
        </p>

        <Link href="/problems" style={backLinkStyle}>
          ← Back to Problems
        </Link>
      </main>
    );
  }

  const difficultyColor =
    problem.difficulty === "EASY"
      ? "#22c55e"
      : problem.difficulty === "MEDIUM"
        ? "#f59e0b"
        : "#ef4444";

  const publicTestCase = problem.testCases?.find(
    (testCase) => !testCase.isHidden
  );

  return (
    <main style={pageStyle}>
      <div style={{ marginBottom: "18px" }}>
        <Link href="/problems" style={backLinkStyle}>
          ← Back to Problems
        </Link>
      </div>

      <div style={layoutStyle}>
        <section style={problemPanelStyle}>
          <h1 style={titleStyle}>{problem.title}</h1>

          <div style={badgeRowStyle}>
            <span
              style={{
                ...badgeStyle,
                color: difficultyColor,
                borderColor: difficultyColor,
              }}
            >
              {problem.difficulty}
            </span>

            <span style={normalBadgeStyle}>
              {problem.language || "GENERAL"}
            </span>

            <span style={normalBadgeStyle}>
              {problem.topic || "General"}
            </span>
          </div>

          <h2 style={headingStyle}>Problem Statement</h2>

          <pre style={descriptionStyle}>
            {problem.description}
          </pre>

          {publicTestCase && (
            <>
              <h2 style={headingStyle}>
                Sample Test Case
              </h2>

              <div style={exampleCardStyle}>
                <h3 style={{ marginTop: 0 }}>
                  Sample Input
                </h3>

                <pre style={codeBlockStyle}>
                  {publicTestCase.input}
                </pre>

                <h3>Sample Output</h3>

                <pre style={codeBlockStyle}>
                  {publicTestCase.expectedOutput}
                </pre>
              </div>
            </>
          )}

          <h2 style={headingStyle}>Limits</h2>

          <ul style={constraintStyle}>
            <li>
              Time Limit: {problem.timeLimit || 2} seconds
            </li>

            <li>
              Memory Limit: {problem.memoryLimit || 256} MB
            </li>
          </ul>
        </section>

        <section style={editorPanelStyle}>
          <CodeEditor problemId={problem.id} />
        </section>
      </div>
    </main>
  );
}

const pageStyle = {
  background: "#020617",
  color: "white",
  minHeight: "100vh",
  padding: "24px",
};

const layoutStyle = {
  display: "grid",
  gridTemplateColumns:
    "minmax(320px, 1fr) minmax(420px, 1.1fr)",
  gap: "20px",
  alignItems: "start",
};

const problemPanelStyle = {
  background: "#0f172a",
  border: "1px solid #334155",
  borderRadius: "14px",
  padding: "26px",
  minHeight: "720px",
};

const editorPanelStyle = {
  minWidth: 0,
};

const titleStyle = {
  fontSize: "32px",
  marginTop: 0,
  marginBottom: "18px",
};

const badgeRowStyle = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap" as const,
  marginBottom: "28px",
};

const badgeStyle = {
  border: "1px solid",
  borderRadius: "999px",
  padding: "6px 12px",
  fontSize: "13px",
  fontWeight: "bold",
};

const normalBadgeStyle = {
  border: "1px solid #475569",
  borderRadius: "999px",
  padding: "6px 12px",
  color: "#cbd5e1",
  fontSize: "13px",
};

const headingStyle = {
  marginTop: "30px",
  marginBottom: "14px",
};

const descriptionStyle = {
  whiteSpace: "pre-wrap" as const,
  overflowWrap: "anywhere" as const,
  fontFamily: "inherit",
  lineHeight: 1.7,
  color: "#cbd5e1",
  margin: 0,
};

const exampleCardStyle = {
  background: "#020617",
  border: "1px solid #334155",
  borderRadius: "12px",
  padding: "18px",
};

const codeBlockStyle = {
  background: "#000814",
  border: "1px solid #1e293b",
  borderRadius: "8px",
  padding: "14px",
  whiteSpace: "pre-wrap" as const,
  color: "#e2e8f0",
  overflowX: "auto" as const,
};

const constraintStyle = {
  color: "#cbd5e1",
  lineHeight: 2,
};

const backLinkStyle = {
  color: "#60a5fa",
  textDecoration: "none",
};