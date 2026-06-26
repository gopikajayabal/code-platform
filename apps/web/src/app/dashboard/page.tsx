"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type DashboardStats = {
  totalProblems: number;
  solvedProblems: number;
  submissions: number;
};

type LanguageProgress = {
  language: string;
  total: number;
  solved: number;
  completed: boolean;
};

export default function DashboardPage() {
  const [username, setUsername] = useState("");
  const [stats, setStats] = useState<DashboardStats>({
    totalProblems: 0,
    solvedProblems: 0,
    submissions: 0,
  });
  const [progress, setProgress] = useState<LanguageProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setUsername(user.username || "User");
      } catch {
        setUsername("User");
      }
    }

    async function loadDashboard() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const [statsRes, progressRes] = await Promise.all([
          fetch("http://localhost:5000/api/submissions/stats", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://localhost:5000/api/submissions/progress", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const statsData = await statsRes.json();
        const progressData = await progressRes.json();

        if (statsData.success) {
          setStats({
            totalProblems: statsData.totalProblems || 0,
            solvedProblems: statsData.solvedProblems || 0,
            submissions: statsData.submissions || 0,
          });
        }

        if (progressData.success) {
          setProgress(progressData.progress || []);
        }
      } catch {
        console.log("Dashboard data failed");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  return (
    <main
      style={{
        background: "#020617",
        color: "white",
        minHeight: "100vh",
        padding: "40px",
      }}
    >
      <h1>Dashboard</h1>

      <p style={{ color: "#94a3b8", marginTop: "10px" }}>
        Welcome back, {username || "User"} 👋
      </p>

      <div style={statsGridStyle}>
        <div style={cardStyle}>
          <h2>{loading ? "..." : stats.totalProblems}</h2>
          <p>Total Problems</p>
        </div>

        <div style={cardStyle}>
          <h2>{loading ? "..." : stats.solvedProblems}</h2>
          <p>Solved Problems</p>
        </div>

        <div style={cardStyle}>
          <h2>{loading ? "..." : stats.submissions}</h2>
          <p>Submissions</p>
        </div>
      </div>

      <div style={badgeBoxStyle}>
        <h2 style={{ marginTop: 0 }}>Your Badges</h2>

        <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
          {stats.solvedProblems >= 10 && (
            <span style={badgeStyle}>🥉 Bronze Solver</span>
          )}

          {stats.solvedProblems >= 50 && (
            <span style={badgeStyle}>🥈 Silver Solver</span>
          )}

          {stats.solvedProblems >= 100 && (
            <span style={badgeStyle}>🥇 Gold Solver</span>
          )}

          {stats.solvedProblems >= 250 && (
            <span style={badgeStyle}>👑 Master Coder</span>
          )}

          {stats.solvedProblems < 10 && (
            <p style={{ color: "#94a3b8", margin: 0 }}>
              Solve {10 - stats.solvedProblems} more problems to unlock your
              first badge 🥉
            </p>
          )}
        </div>
      </div>

      <h2 style={{ marginTop: "42px" }}>Language Progress</h2>

      <div style={progressGridStyle}>
        {progress.map((item) => {
          const percentage =
            item.total > 0 ? Math.round((item.solved / item.total) * 100) : 0;

          return (
            <div key={item.language} style={cardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <h3 style={{ marginTop: 0 }}>{item.language}</h3>

                {item.completed && (
                  <span style={{ color: "#fbbf24", fontWeight: "bold" }}>
                    🏆 Completed
                  </span>
                )}
              </div>

              <p style={{ color: "#cbd5e1" }}>
                {item.solved} / {item.total} problems solved
              </p>

              <div
                style={{
                  height: "10px",
                  background: "#1e293b",
                  borderRadius: "999px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${percentage}%`,
                    height: "100%",
                    background: item.completed ? "#22c55e" : "#2563eb",
                  }}
                />
              </div>

              <p style={{ color: "#94a3b8", marginBottom: 0 }}>
                {percentage}% complete
              </p>

              {item.completed && (
                <Link
                  href={`/certificate/${item.language}`}
                  style={{
                    display: "inline-block",
                    marginTop: "14px",
                    color: "#fbbf24",
                  }}
                >
                  View Certificate →
                </Link>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: "30px", display: "flex", gap: "20px" }}>
        <Link href="/problems" style={{ color: "#60a5fa" }}>
          Continue Solving →
        </Link>

        <Link href="/leaderboard" style={{ color: "#fbbf24" }}>
          View Leaderboard →
        </Link>
      </div>
    </main>
  );
}

const statsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: "20px",
  marginTop: "30px",
};

const progressGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: "20px",
  marginTop: "20px",
};

const cardStyle = {
  background: "#0f172a",
  border: "1px solid #334155",
  borderRadius: "14px",
  padding: "24px",
};

const badgeBoxStyle = {
  marginTop: "42px",
  background: "#0f172a",
  border: "1px solid #334155",
  borderRadius: "14px",
  padding: "24px",
};

const badgeStyle = {
  background: "#1e293b",
  border: "1px solid #fbbf24",
  color: "#fbbf24",
  borderRadius: "999px",
  padding: "10px 14px",
  fontWeight: "bold",
};
