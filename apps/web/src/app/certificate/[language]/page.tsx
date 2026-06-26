"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type LanguageProgress = {
  language: string;
  total: number;
  solved: number;
  completed: boolean;
};

export default function CertificatePage({
  params,
}: {
  params: { language: string };
}) {
  const [username, setUsername] = useState("Learner");
  const [progress, setProgress] = useState<LanguageProgress | null>(null);
  const [loading, setLoading] = useState(true);

  const language = decodeURIComponent(params.language);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setUsername(user.username || "Learner");
      } catch {
        setUsername("Learner");
      }
    }

    async function loadCertificate() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(
          "http://localhost:5000/api/submissions/progress",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await res.json();

        if (data.success) {
          const selectedLanguage = (data.progress || []).find(
            (item: LanguageProgress) => item.language === language
          );

          setProgress(selectedLanguage || null);
        }
      } catch {
        setProgress(null);
      } finally {
        setLoading(false);
      }
    }

    loadCertificate();
  }, [language]);

  if (loading) {
    return (
      <main style={pageStyle}>
        <p>Loading certificate...</p>
      </main>
    );
  }

  if (!progress || !progress.completed) {
    return (
      <main style={pageStyle}>
        <h1>Certificate Locked 🔒</h1>

        <p style={{ color: "#cbd5e1", marginTop: "16px" }}>
          Complete all {progress?.total || 0} {language} problems to unlock
          your certificate.
        </p>

        <Link href="/dashboard" style={linkStyle}>
          ← Back to Dashboard
        </Link>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <div style={certificateStyle}>
        <p style={{ color: "#fbbf24", fontSize: "18px", marginBottom: "20px" }}>
          🏆 CODE PLATFORM CERTIFICATE
        </p>

        <h1 style={{ fontSize: "42px", marginBottom: "14px" }}>
          Certificate of Completion
        </h1>

        <p style={{ color: "#cbd5e1", fontSize: "18px" }}>
          This certificate is proudly awarded to
        </p>

        <h2 style={{ fontSize: "36px", color: "#60a5fa", margin: "22px 0" }}>
          {username}
        </h2>

        <p style={{ color: "#cbd5e1", fontSize: "18px" }}>
          for successfully completing
        </p>

        <h2 style={{ fontSize: "30px", color: "#22c55e", margin: "18px 0" }}>
          {progress.total} {language} Programming Problems
        </h2>

        <p style={{ color: "#94a3b8", marginTop: "38px" }}>
          Issued by Code Platform • Keep Learning, Keep Growing
        </p>
      </div>

      <div style={{ marginTop: "24px" }}>
        <Link href="/dashboard" style={linkStyle}>
          ← Back to Dashboard
        </Link>
      </div>
    </main>
  );
}

const pageStyle = {
  background: "#020617",
  color: "white",
  minHeight: "100vh",
  padding: "40px",
  textAlign: "center" as const,
};

const certificateStyle = {
  maxWidth: "900px",
  margin: "40px auto",
  padding: "60px 30px",
  border: "3px solid #fbbf24",
  borderRadius: "18px",
  background: "#0f172a",
  boxShadow: "0 0 30px rgba(251, 191, 36, 0.18)",
};

const linkStyle = {
  color: "#60a5fa",
  textDecoration: "none",
  fontWeight: "bold",
};