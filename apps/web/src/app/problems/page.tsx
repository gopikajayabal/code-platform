"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Problem = {
  id: string;
  title: string;
  slug: string;
  language?: string;
  topic?: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  solvedCount: number;
  totalCount: number;
};

export default function ProblemsPage() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [search, setSearch] = useState("");
  const [language, setLanguage] = useState("ALL");
  const [topic, setTopic] = useState("ALL");
  const [difficulty, setDifficulty] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProblems() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("http://localhost:5000/api/problems", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to load problems");
        }

        const data = await response.json();

        const normalizedProblems: Problem[] = (
          Array.isArray(data) ? data : data.problems || []
        ).map((problem: Problem) => ({
          ...problem,
          language: problem.language?.trim() || "GENERAL",
          topic: problem.topic?.trim() || "General",
          solvedCount: Number(problem.solvedCount || 0),
          totalCount: Number(problem.totalCount || 0),
        }));

        setProblems(normalizedProblems);
      } catch (err) {
        setProblems([]);
        setError(
          err instanceof Error
            ? err.message
            : "Could not connect to backend."
        );
      } finally {
        setLoading(false);
      }
    }

    loadProblems();
  }, []);

  const languages = useMemo(() => {
    return Array.from(
      new Set(
        problems.map((problem) =>
          (problem.language || "GENERAL").toUpperCase()
        )
      )
    ).sort();
  }, [problems]);

  const topics = useMemo(() => {
    const languageProblems =
      language === "ALL"
        ? problems
        : problems.filter(
            (problem) =>
              (problem.language || "GENERAL").toUpperCase() === language
          );

    return Array.from(
      new Set(
        languageProblems.map(
          (problem) => problem.topic?.trim() || "General"
        )
      )
    ).sort();
  }, [language, problems]);

  useEffect(() => {
    setTopic("ALL");
  }, [language]);

  const filteredProblems = useMemo(() => {
    return problems.filter((problem) => {
      const problemLanguage = (
        problem.language || "GENERAL"
      ).toUpperCase();

      const problemTopic = problem.topic?.trim() || "General";

      const matchesSearch = problem.title
        .toLowerCase()
        .includes(search.toLowerCase().trim());

      const matchesLanguage =
        language === "ALL" || problemLanguage === language;

      const matchesTopic =
        topic === "ALL" || problemTopic === topic;

      const matchesDifficulty =
        difficulty === "ALL" ||
        problem.difficulty === difficulty;

      return (
        matchesSearch &&
        matchesLanguage &&
        matchesTopic &&
        matchesDifficulty
      );
    });
  }, [problems, search, language, topic, difficulty]);

  function getDifficultyColor(value: string) {
    if (value === "EASY") return "#22c55e";
    if (value === "MEDIUM") return "#f59e0b";
    return "#ef4444";
  }

  return (
    <main
      style={{
        background: "#020617",
        color: "white",
        minHeight: "100vh",
        padding: "30px",
      }}
    >
      <h1 style={{ fontSize: "32px", marginBottom: "8px" }}>
        Programming Problems
      </h1>

      <p style={{ color: "#94a3b8", marginBottom: "20px" }}>
        {loading
          ? "Loading problems..."
          : `${filteredProblems.length} problems found`}
      </p>

      {error && (
        <p
          style={{
            color: "#ef4444",
            marginBottom: "20px",
            fontWeight: "bold",
          }}
        >
          {error}
        </p>
      )}

      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "20px",
          flexWrap: "wrap",
        }}
      >
        <input
          placeholder="Search problems..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          style={inputStyle}
        />

        <select
          value={language}
          onChange={(event) => setLanguage(event.target.value)}
          style={inputStyle}
        >
          <option value="ALL">All Languages</option>

          {languages.map((languageName) => (
            <option key={languageName} value={languageName}>
              {languageName}
            </option>
          ))}
        </select>

        <select
          value={topic}
          onChange={(event) => setTopic(event.target.value)}
          style={inputStyle}
        >
          <option value="ALL">All Topics</option>

          {topics.map((topicName) => (
            <option key={topicName} value={topicName}>
              {topicName}
            </option>
          ))}
        </select>

        <select
          value={difficulty}
          onChange={(event) => setDifficulty(event.target.value)}
          style={inputStyle}
        >
          <option value="ALL">All Difficulties</option>
          <option value="EASY">Easy</option>
          <option value="MEDIUM">Medium</option>
          <option value="HARD">Hard</option>
        </select>
      </div>

      <div
        style={{
          border: "1px solid #334155",
          borderRadius: "12px",
          overflow: "hidden",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
          }}
        >
          <thead
            style={{
              background: "#0f172a",
              color: "#94a3b8",
            }}
          >
            <tr>
              <th style={thStyle}>Title</th>
              <th style={thStyle}>Language</th>
              <th style={thStyle}>Topic</th>
              <th style={thStyle}>Difficulty</th>
              <th style={thStyle}>Acceptance</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ padding: "20px" }}>
                  Loading problems...
                </td>
              </tr>
            ) : filteredProblems.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: "20px" }}>
                  No problems found.
                </td>
              </tr>
            ) : (
              filteredProblems.map((problem) => {
                const acceptance =
                  problem.totalCount > 0
                    ? (
                        (problem.solvedCount /
                          problem.totalCount) *
                        100
                      ).toFixed(1)
                    : "0.0";

                return (
                  <tr
                    key={problem.id}
                    style={{
                      borderTop: "1px solid #334155",
                    }}
                  >
                    <td style={{ padding: "14px" }}>
                      <Link
                        href={`/problems/${problem.slug}`}
                        style={{
                          color: "#60a5fa",
                          textDecoration: "none",
                          fontWeight: "bold",
                        }}
                      >
                        {problem.title}
                      </Link>
                    </td>

                    <td
                      style={{
                        padding: "14px",
                        color: "#cbd5e1",
                      }}
                    >
                      {(problem.language || "GENERAL").toUpperCase()}
                    </td>

                    <td
                      style={{
                        padding: "14px",
                        color: "#cbd5e1",
                      }}
                    >
                      {problem.topic || "General"}
                    </td>

                    <td style={{ padding: "14px" }}>
                      <span
                        style={{
                          color: getDifficultyColor(
                            problem.difficulty
                          ),
                          fontWeight: "bold",
                        }}
                      >
                        {problem.difficulty}
                      </span>
                    </td>

                    <td
                      style={{
                        padding: "14px",
                        color: "#cbd5e1",
                      }}
                    >
                      {acceptance}%
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}

const inputStyle = {
  padding: "12px",
  minWidth: "180px",
  borderRadius: "8px",
  border: "1px solid #334155",
  background: "#0f172a",
  color: "white",
};

const thStyle = {
  padding: "14px",
  textAlign: "left" as const,
};