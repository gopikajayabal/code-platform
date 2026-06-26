"use client";

import { useEffect, useState } from "react";

type LeaderboardUser = {
  rank: number;
  userId: string;
  username: string;
  solved: number;
  submissions: number;
};

export default function PublicProfilePage({
  params,
}: {
  params: { username: string };
}) {
  const [user, setUser] = useState<LeaderboardUser | null>(null);
  const [loading, setLoading] = useState(true);
  const username = decodeURIComponent(params.username);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch(
          "http://localhost:5000/api/submissions/leaderboard"
        );
        const data = await res.json();

        if (data.success) {
          const found = data.leaderboard.find(
            (item: LeaderboardUser) => item.username === username
          );
          setUser(found || null);
        }
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [username]);

  function copyLink() {
    navigator.clipboard.writeText(window.location.href);
    alert("Profile link copied!");
  }

  if (loading) {
    return <main style={pageStyle}>Loading profile...</main>;
  }

  if (!user) {
    return (
      <main style={pageStyle}>
        <h1>User not found</h1>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <div style={cardStyle}>
        <h1>{user.username}</h1>

        <p style={{ color: "#94a3b8" }}>
          Public coding rank profile
        </p>

        <h2>Rank #{user.rank}</h2>
        <p>Solved Problems: {user.solved}</p>
        <p>Total Submissions: {user.submissions}</p>

        <button onClick={copyLink} style={buttonStyle}>
          Copy Share Link
        </button>
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

const cardStyle = {
  background: "#0f172a",
  border: "1px solid #334155",
  borderRadius: "16px",
  padding: "30px",
  maxWidth: "500px",
};

const buttonStyle = {
  marginTop: "20px",
  padding: "12px 18px",
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: "10px",
  cursor: "pointer",
};