import CodeEditor from "../../components/editor/CodeEditor";
import Link from "next/link";

async function getProblem(slug: string) {
  const res = await fetch(`http://localhost:5000/api/problems/${slug}`, {
    cache: "no-store",
  });

  return res.json();
}

export default async function ProblemDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const problem = await getProblem(slug);

  const difficultyColor =
    problem.difficulty === "EASY"
      ? "#22c55e"
      : problem.difficulty === "MEDIUM"
      ? "#f59e0b"
      : "#ef4444";

  return (
    <main
      style={{
        background: "#020617",
        color: "white",
        minHeight: "100vh",
        padding: "24px",
      }}
    >
      <div style={{ marginBottom: "18px" }}>
        <Link
          href="/problems"
          style={{ color: "#60a5fa", textDecoration: "none" }}
        >
          ← Back to Problems
        </Link>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1.1fr",
          gap: "20px",
        }}
      >
        <section
          style={{
            background: "#0f172a",
            border: "1px solid #334155",
            borderRadius: "14px",
            padding: "24px",
          }}
        >
          <h1 style={{ fontSize: "30px", marginBottom: "12px" }}>
            {problem.title}
          </h1>

          <span
            style={{
              display: "inline-block",
              color: difficultyColor,
              background: "#020617",
              border: `1px solid ${difficultyColor}`,
              padding: "6px 12px",
              borderRadius: "999px",
              fontWeight: "bold",
              fontSize: "13px",
            }}
          >
            {problem.difficulty}
          </span>

          <div style={{ marginTop: "28px" }}>
            <h2 style={{ fontSize: "20px", marginBottom: "12px" }}>
              Problem Statement
            </h2>

            <p
              style={{
                color: "#cbd5e1",
                lineHeight: "1.8",
                fontSize: "16px",
              }}
            >
              {problem.description}
            </p>
          </div>

          <div
            style={{
              marginTop: "28px",
              background: "#020617",
              border: "1px solid #334155",
              borderRadius: "10px",
              padding: "16px",
            }}
          >
            <h3 style={{ marginTop: 0 }}>Example</h3>

            <pre
              style={{
                color: "#cbd5e1",
                whiteSpace: "pre-wrap",
                marginBottom: 0,
              }}
            >
{`Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: nums[0] + nums[1] = 9`}
            </pre>
          </div>

          <div style={{ marginTop: "28px" }}>
            <h3>Constraints</h3>
            <ul style={{ color: "#cbd5e1", lineHeight: "1.8" }}>
              <li>Input size will be within valid limits.</li>
              <li>Time Limit: {problem.timeLimit}s</li>
              <li>Memory Limit: {problem.memoryLimit} MB</li>
            </ul>
          </div>
        </section>

        <section>
          <CodeEditor problemId={problem.id} />
        </section>
      </div>
    </main>
  );
}