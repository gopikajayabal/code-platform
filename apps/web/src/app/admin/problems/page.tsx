"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type User = {
  username: string;
  role?: "USER" | "ADMIN";
};

type Problem = {
  id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  language: string;
  topic: string;
};

export default function AdminProblemsPage() {
  const [allowed, setAllowed] = useState(false);
  const [checking, setChecking] = useState(true);

  const [problems, setProblems] = useState<Problem[]>([]);
  const [editingId, setEditingId] = useState("");

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState("EASY");
  const [language, setLanguage] = useState("C");
  const [topic, setTopic] = useState("Basics");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const savedUser = localStorage.getItem("user");

    if (savedUser) {
      try {
        const user: User = JSON.parse(savedUser);
        setAllowed(user.role === "ADMIN");
      } catch {
        setAllowed(false);
      }
    }

    setChecking(false);
    loadProblems();
  }, []);

  async function loadProblems() {
    const res = await fetch("http://localhost:5000/api/problems");
    const data = await res.json();
    setProblems(data.problems || []);
  }

  function resetForm() {
    setEditingId("");
    setTitle("");
    setSlug("");
    setDescription("");
    setDifficulty("EASY");
    setLanguage("C");
    setTopic("Basics");
  }

  async function saveProblem() {
    const token = localStorage.getItem("token");

    const body = {
      title,
      slug,
      description,
      difficulty,
      language,
      topic,
    };

    const url = editingId
      ? `http://localhost:5000/api/problems/${editingId}`
      : "http://localhost:5000/api/problems";

    const method = editingId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (data.success) {
      setMessage(
        editingId
          ? "Problem updated successfully!"
          : "Problem created successfully!"
      );
      resetForm();
      loadProblems();
    } else {
      setMessage(data.message || "Action failed");
    }
  }

  function editProblem(problem: Problem) {
    setEditingId(problem.id);
    setTitle(problem.title);
    setSlug(problem.slug);
    setDescription(problem.description);
    setDifficulty(problem.difficulty);
    setLanguage(problem.language || "GENERAL");
    setTopic(problem.topic || "General");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteProblem(id: string) {
    const ok = confirm("Are you sure you want to delete this problem?");
    if (!ok) return;

    const token = localStorage.getItem("token");

    const res = await fetch(`http://localhost:5000/api/problems/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

    if (data.success) {
      setMessage("Problem deleted successfully!");
      loadProblems();
    } else {
      setMessage(data.message || "Delete failed");
    }
  }

  if (checking) {
    return (
      <main style={pageStyle}>
        <h1>Checking access...</h1>
      </main>
    );
  }

  if (!allowed) {
    return (
      <main style={pageStyle}>
        <h1>Access Denied</h1>
        <p style={{ color: "#94a3b8" }}>
          You do not have admin permission to access this page.
        </p>
        <Link href="/problems" style={{ color: "#60a5fa" }}>
          Back to Problems
        </Link>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <h1>{editingId ? "Admin - Edit Problem" : "Admin - Add Problem"}</h1>

      <div style={formStyle}>
        <input
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={inputStyle}
        />

        <input
          placeholder="Slug e.g. binary-search"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          style={inputStyle}
        />

        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{ ...inputStyle, minHeight: "120px" }}
        />

        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          style={inputStyle}
        >
          <option value="C">C</option>
          <option value="C++">C++</option>
          <option value="Java">Java</option>
          <option value="Python">Python</option>
          <option value="HTML">HTML</option>
          <option value="GENERAL">GENERAL</option>
        </select>

        <input
          placeholder="Topic e.g. Arrays"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          style={inputStyle}
        />

        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          style={inputStyle}
        >
          <option value="EASY">Easy</option>
          <option value="MEDIUM">Medium</option>
          <option value="HARD">Hard</option>
        </select>

        <div style={{ display: "flex", gap: "12px" }}>
          <button onClick={saveProblem} style={buttonStyle}>
            {editingId ? "Update Problem" : "Create Problem"}
          </button>

          {editingId && (
            <button onClick={resetForm} style={cancelButtonStyle}>
              Cancel
            </button>
          )}
        </div>

        <p>{message}</p>
      </div>

      <h2 style={{ marginTop: "40px" }}>Manage Problems ({problems.length})</h2>

      <div style={{ display: "grid", gap: "12px", marginTop: "20px" }}>
        {problems.slice(0, 50).map((problem) => (
          <div key={problem.id} style={problemCardStyle}>
            <div>
              <strong>{problem.title}</strong>
              <p style={{ color: "#94a3b8", margin: "6px 0" }}>
                {problem.language} • {problem.topic} • {problem.difficulty}
              </p>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => editProblem(problem)}
                style={smallButtonStyle}
              >
                Edit
              </button>

              <button
                onClick={() => deleteProblem(problem.id)}
                style={deleteButtonStyle}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

const pageStyle = {
  background: "#020617",
  color: "white",
  minHeight: "100vh",
  padding: "40px",
};

const formStyle = {
  maxWidth: "650px",
  marginTop: "30px",
  display: "flex",
  flexDirection: "column" as const,
  gap: "14px",
};

const inputStyle = {
  padding: "14px",
  borderRadius: "10px",
  border: "1px solid #334155",
  background: "#0f172a",
  color: "white",
};

const buttonStyle = {
  padding: "14px",
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "bold",
};

const cancelButtonStyle = {
  ...buttonStyle,
  background: "#475569",
};

const problemCardStyle = {
  background: "#0f172a",
  border: "1px solid #334155",
  borderRadius: "12px",
  padding: "16px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const smallButtonStyle = {
  padding: "8px 12px",
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
};

const deleteButtonStyle = {
  ...smallButtonStyle,
  background: "#ef4444",
};