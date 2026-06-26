"use client";

import { useEffect, useState } from "react";

type LeaderboardUser = {
  rank: number;
  userId: string;
  username: string;
  solved: number;
  submissions: number;
};

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadLeaderboard() {
      try {
        const res = await fetch(
          "http://localhost:5000/api/submissions/leaderboard"
        );

        const data = await res.json();

        if (data.success) {
          setLeaderboard(data.leaderboard || []);
        } else {
          setError("Could not load leaderboard.");
        }
      } catch {
        setError("Could not connect to backend.");
      } finally {
        setLoading(false);
      }
    }

    loadLeaderboard();
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
      <h1 style={{ fontSize: "32px", marginBottom: "8px" }}>
        Leaderboard
      </h1>

      <p style={{ color: "#94a3b8", marginBottom: "28px" }}>
        Top learners ranked by solved problems.
      </p>

      {loading ? (
        <p>Loading leaderboard...</p>
      ) : error ? (
        <p style={{ color: "#f87171" }}>{error}</p>
      ) : (
        <div
          style={{
            border: "1px solid #334155",
            borderRadius: "12px",
            overflow: "hidden",
            maxWidth: "900px",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ background: "#0f172a", color: "#94a3b8" }}>
              <tr>
                <th style={thStyle}>Rank</th>
                <th style={thStyle}>User</th>
                <th style={thStyle}>Solved</th>
                <th style={thStyle}>Submissions</th>
              </tr>
            </thead>

            <tbody>
              {leaderboard.map((user) => (
                <tr
                  key={user.userId}
                  style={{ borderTop: "1px solid #334155" }}
                >
                  <td style={tdStyle}>
                    {user.rank === 1
                      ? "🥇 #1"
                      : user.rank === 2
                      ? "🥈 #2"
                      : user.rank === 3
                      ? "🥉 #3"
                      : `#${user.rank}`}
                  </td>

                  <td style={tdStyle}>
                    {user.username || "Anonymous User"}
                  </td>

                  <td style={{ ...tdStyle, color: "#22c55e", fontWeight: "bold" }}>
                    {user.solved}
                  </td>

                  <td style={tdStyle}>{user.submissions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

const thStyle = {
  padding: "14px",
  textAlign: "left" as const,
};

const tdStyle = {
  padding: "14px",
};