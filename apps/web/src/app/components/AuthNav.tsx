"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type User = {
  username: string;
  role?: "USER" | "ADMIN";
};

export default function AuthNav() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<"USER" | "ADMIN">("USER");
  const [openMenu, setOpenMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    setLoggedIn(!!token);

    if (savedUser) {
      try {
        const user: User = JSON.parse(savedUser);
        setUsername(user.username || "");
        setRole(user.role || "USER");
      } catch {
        setUsername("");
        setRole("USER");
      }
    }
  }, []);

  useEffect(() => {
    function closeMenu(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenu(false);
      }
    }

    document.addEventListener("mousedown", closeMenu);
    return () => document.removeEventListener("mousedown", closeMenu);
  }, []);

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  }

  if (loggedIn) {
    return (
      <>
        <Link href="/problems" style={navLinkStyle}>
          Problems
        </Link>

        <Link href="/dashboard" style={navLinkStyle}>
          Dashboard
        </Link>

        <Link href="/leaderboard" style={navLinkStyle}>
          Leaderboard
        </Link>

        <Link href="/submissions" style={navLinkStyle}>
          Submissions
        </Link>

        {role === "ADMIN" && (
          <>
            <Link href="/admin/problems" style={adminLinkStyle}>
              Admin
            </Link>

            <Link href="/admin/notifications" style={adminLinkStyle}>
              Notifications
            </Link>
          </>
        )}

        <div ref={menuRef} style={{ position: "relative" }}>
          <button
            onClick={() => setOpenMenu(!openMenu)}
            style={profileButtonStyle}
          >
            Hi, {username} ▾
          </button>

          {openMenu && (
            <div style={dropdownStyle}>
              <Link
                href={`/profile/${username}`}
                style={dropdownLinkStyle}
                onClick={() => setOpenMenu(false)}
              >
                My Profile
              </Link>

              <Link
                href="/dashboard"
                style={dropdownLinkStyle}
                onClick={() => setOpenMenu(false)}
              >
                Dashboard
              </Link>

              <button onClick={logout} style={logoutMenuStyle}>
                Logout
              </button>
            </div>
          )}
        </div>
      </>
    );
  }

  return (
    <>
      <Link href="/login" style={navLinkStyle}>
        Login
      </Link>

      <Link href="/register" style={navLinkStyle}>
        Register
      </Link>
    </>
  );
}

const navLinkStyle = {
  color: "white",
  textDecoration: "none",
};

const adminLinkStyle = {
  color: "#fbbf24",
  textDecoration: "none",
};

const profileButtonStyle = {
  background: "transparent",
  color: "#cbd5e1",
  border: "none",
  cursor: "pointer",
  fontSize: "16px",
  padding: "8px",
};

const dropdownStyle = {
  position: "absolute" as const,
  top: "42px",
  right: 0,
  minWidth: "160px",
  background: "#0f172a",
  border: "1px solid #334155",
  borderRadius: "10px",
  padding: "8px",
  display: "flex",
  flexDirection: "column" as const,
  gap: "4px",
  zIndex: 50,
  boxShadow: "0 12px 30px rgba(0,0,0,0.35)",
};

const dropdownLinkStyle = {
  color: "white",
  textDecoration: "none",
  padding: "10px",
  borderRadius: "7px",
};

const logoutMenuStyle = {
  background: "#ef4444",
  color: "white",
  border: "none",
  borderRadius: "7px",
  padding: "10px",
  cursor: "pointer",
  textAlign: "left" as const,
};