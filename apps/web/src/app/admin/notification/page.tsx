"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Submission = {
  id: string;
  language: string;
  status: string;
  createdAt: string;
  problem: {
    title: string;
    slug: string;
  };
  user: {
    username: string;
    email: string;
  };
};

export default function AdminNotificationsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadNotifications() {
      try {
        const res = await fetch("http://localhost:5000/api/submissions/admin/all");
        const data = await res.json();
        setSubmissions(data.submissions || []);
      } catch {
        setSubmissions([]);
      } finally {
        setLoading(false);
      }
    }

    loadNotifications();
  }, []);

  return (
    <main style={pageStyle}>
      <h1>Admin Notifications</h1>
      <p style={{ color: "#94a3b8" }}>
        Latest user submissions will appear here.
      </p>

      {loading ? (
        <p>Loading...</p>
      ) : submissions.length === 0 ? (
        <p>No notifications yet.</p>
      ) : (
        <div style={{ marginTop: "24px", display: "grid", gap: "14px" }}>
          {submissions.map((submission) => (
            <div key={submission.id} style={cardStyle}>
              <strong>New submission from {submission.user?.username || "User"}</strong>
              <p>Problem: {submission.problem?.title}</p>
              <p>Language: {submission.language}</p>
              <p>Status: {submission.status}</p>
              <p style={{ color: "#94a3b8" }}>
                {new Date(submission.createdAt).toLocaleString()}
              </p>

              <Link
                href={`/problems/${submission.problem?.slug}`}
                style={{ color: "#60a5fa" }}
              >
                View Problem →
              </Link>
            </div>
          ))}
        </div>
      )}
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
  borderRadius: "14px",
  padding: "18px",
};