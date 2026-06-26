"use client";

import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleLogin() {
    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        window.location.href = "/problems";
      } else {
        setMessage(data.error || "Login failed");
      }
    } catch {
      setMessage("Backend server is not running.");
    }
  }

  return (
    <main
      style={{
        background: "linear-gradient(135deg, #020617, #0f172a)",
        color: "white",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "30px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "#0f172a",
          border: "1px solid #334155",
          borderRadius: "18px",
          padding: "34px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
        }}
      >
        <h1 style={{ fontSize: "32px", marginBottom: "8px" }}>Welcome Back</h1>
        <p style={{ color: "#94a3b8", marginBottom: "28px" }}>
          Login to continue solving coding problems.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <input
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              padding: "14px",
              borderRadius: "10px",
              border: "1px solid #334155",
              background: "#020617",
              color: "white",
            }}
          />

          <input
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              padding: "14px",
              borderRadius: "10px",
              border: "1px solid #334155",
              background: "#020617",
              color: "white",
            }}
          />

          <button
            onClick={handleLogin}
            style={{
              padding: "14px",
              background: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: "10px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Login
          </button>

          {message && <p style={{ color: "#f87171" }}>{message}</p>}

          <p style={{ color: "#94a3b8", textAlign: "center" }}>
            New here?{" "}
            <Link href="/register" style={{ color: "#60a5fa" }}>
              Create account
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}