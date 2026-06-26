"use client";

import { useState } from "react";
import Link from "next/link";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleRegister() {
    setMessage("");

    if (!email || !username || !password) {
      setMessage("Please fill all fields.");
      return;
    }

    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, username, password }),
      });

      const data = await res.json();

      if (data.success && data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        window.location.href = "/problems";
      } else {
        setMessage(data.message || data.error || "Register failed");
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
          maxWidth: "430px",
          background: "#0f172a",
          border: "1px solid #334155",
          borderRadius: "18px",
          padding: "34px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
        }}
      >
        <h1 style={{ fontSize: "32px", marginBottom: "8px" }}>
          Create Account
        </h1>

        <p style={{ color: "#94a3b8", marginBottom: "28px" }}>
          Join and start solving coding problems.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <input
            placeholder="Email address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
          />

          <input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={inputStyle}
          />

          <input
            placeholder="Password (minimum 6 characters)"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
          />

          <button onClick={handleRegister} style={buttonStyle}>
            Register
          </button>

          {message && <p style={{ color: "#f87171" }}>{message}</p>}

          <p style={{ color: "#94a3b8", textAlign: "center" }}>
            Already have an account?{" "}
            <Link href="/login" style={{ color: "#60a5fa" }}>
              Login
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

const inputStyle = {
  padding: "14px",
  borderRadius: "10px",
  border: "1px solid #334155",
  background: "#020617",
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