"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Problem = {
  id: string;
  title: string;
  slug: string;
  language: string;
  topic: string;
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

  useEffect(() => {
    async function loadProblems() {
      try {
        const res = await fetch("http://localhost:5000/api/problems");
        const data = await res.json();
        setProblems(data.problems || []);
      } catch {
        setProblems([]);
      } finally {
        setLoading(false);
      }
    }

    loadProblems();
  }, []);

  const topics = useMemo(() => {
    const languageProblems =
      language === "ALL"
        ? problems
        : problems.filter((problem) => problem.language === language);

    return Array.from(
      new Set(languageProblems.map((problem) => problem.topic || "General"))
    ).sort();
  }, [language, problems]);

  useEffect(() => {
    setTopic("ALL");
  }, [language]);

  const filteredProblems = problems.filter((problem) => {
    const matchesSearch = problem.title
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesLanguage =
      language === "ALL" || problem.language === language;

    const matchesTopic =
      topic === "ALL" || (problem.topic || "General") === topic;

    const matchesDifficulty =
      difficulty === "ALL" || problem.difficulty === difficulty;

    return (
      matchesSearch &&
      matchesLanguage &&
      matchesTopic &&
      matchesDifficulty
    );
  });

  const getDifficultyColor = (value: string) => {
    if (value === "EASY") return "#22c55e";
    if (value === "MEDIUM") return "#f59e0b";
    return "#ef4444";
  };

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
        {filteredProblems.length} problems found
      </p>

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
          onChange={(e) => setSearch(e.target.value)}
          style={inputStyle}
        />

        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          style={inputStyle}
        >
          <option value="ALL">All Languages</option>
          <option value="C">C</option>
          <option value="C++">C++</option>
          <option value="Java">Java</option>
          <option value="Python">Python</option>
          <option value="HTML">HTML</option>
          <option value="GENERAL">General</option>
        </select>

        <select
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
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
          onChange={(e) => setDifficulty(e.target.value)}
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
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: "#0f172a", color: "#94a3b8" }}>
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
                        (problem.solvedCount / problem.totalCount) *
                        100
                      ).toFixed(1)
                    : "0.0";

                return (
                  <tr
                    key={problem.id}
                    style={{ borderTop: "1px solid #334155" }}
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

                    <td style={{ padding: "14px", color: "#cbd5e1" }}>
                      {problem.language || "GENERAL"}
                    </td>

                    <td style={{ padding: "14px", color: "#cbd5e1" }}>
                      {problem.topic || "General"}
                    </td>

                    <td style={{ padding: "14px" }}>
                      <span
                        style={{
                          color: getDifficultyColor(problem.difficulty),
                          fontWeight: "bold",
                        }}
                      >
                        {problem.difficulty}
                      </span>
                    </td>

                    <td style={{ padding: "14px", color: "#cbd5e1" }}>
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