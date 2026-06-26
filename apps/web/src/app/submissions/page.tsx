"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Submission = {
  id: string;
  language: string;
  status: string;
  output: string | null;
  createdAt: string;
  problem: {
    title: string;
    slug: string;
    difficulty: "EASY" | "MEDIUM" | "HARD";
  };
};

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadSubmissions() {
      const token = localStorage.getItem("token");

      if (!token) {
        setMessage("Please login to view your submissions.");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("http://localhost:5000/api/submissions/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          setMessage(data.error || "Failed to load submissions.");
          setLoading(false);
          return;
        }

        setSubmissions(data.submissions || []);
      } catch {
        setMessage("Could not connect to backend.");
      } finally {
        setLoading(false);
      }
    }

    loadSubmissions();
  }, []);

  const difficultyColor = (difficulty: string) => {
    if (difficulty === "EASY") return "#22c55e";
    if (difficulty === "MEDIUM") return "#f59e0b";
    return "#ef4444";
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#020617",
        color: "white",
        padding: "32px",
      }}
    >
      <h1 style={{ fontSize: "32px", marginBottom: "8px" }}>
        My Submissions
      </h1>

      <p style={{ color: "#94a3b8", marginBottom: "28px" }}>
        Your saved code submissions are shown here.
      </p>

      {loading && <p style={{ color: "#cbd5e1" }}>Loading submissions...</p>}

      {!loading && message && (
        <p style={{ color: "#f87171" }}>{message}</p>
      )}

      {!loading && !message && submissions.length === 0 && (
        <div
          style={{
            border: "1px solid #334155",
            borderRadius: "12px",
            padding: "24px",
            background: "#0f172a",
          }}
        >
          <p style={{ color: "#cbd5e1", marginTop: 0 }}>
            No submissions yet.
          </p>

          <Link
            href="/problems"
            style={{ color: "#60a5fa", textDecoration: "none" }}
          >
            Go to Problems →
          </Link>
        </div>
      )}

      {!loading && submissions.length > 0 && (
        <div
          style={{
            border: "1px solid #334155",
            borderRadius: "12px",
            overflow: "hidden",
            background: "#0f172a",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#111827", textAlign: "left" }}>
                <th style={{ padding: "16px" }}>Problem</th>
                <th style={{ padding: "16px" }}>Difficulty</th>
                <th style={{ padding: "16px" }}>Language</th>
                <th style={{ padding: "16px" }}>Status</th>
                <th style={{ padding: "16px" }}>Submitted At</th>
              </tr>
            </thead>

            <tbody>
              {submissions.map((submission) => (
                <tr
                  key={submission.id}
                  style={{ borderTop: "1px solid #334155" }}
                >
                  <td style={{ padding: "16px" }}>
                    <Link
                      href={`/problems/${submission.problem.slug}`}
                      style={{
                        color: "#60a5fa",
                        textDecoration: "none",
                        fontWeight: "bold",
                      }}
                    >
                      {submission.problem.title}
                    </Link>
                  </td>

                  <td
                    style={{
                      padding: "16px",
                      color: difficultyColor(submission.problem.difficulty),
                      fontWeight: "bold",
                    }}
                  >
                    {submission.problem.difficulty}
                  </td>

                  <td style={{ padding: "16px", color: "#cbd5e1" }}>
                    {submission.language}
                  </td>

                  <td style={{ padding: "16px", color: "#22c55e" }}>
                    {submission.status}
                  </td>

                  <td style={{ padding: "16px", color: "#94a3b8" }}>
                    {new Date(submission.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}