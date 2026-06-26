import React from "react";
import Link from "next/link";
import AuthNav from "./components/AuthNav";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#020617", color: "white" }}>
        <nav
          style={{
            height: "60px",
            borderBottom: "1px solid #334155",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 30px",
            background: "#0f172a",
          }}
        >
          <Link
            href="/"
            style={{
              color: "white",
              textDecoration: "none",
              fontWeight: "bold",
            }}
          >
            Code Platform
          </Link>

          <div
            style={{
              display: "flex",
              gap: "20px",
              alignItems: "center",
            }}
          >
            <AuthNav />
          </div>
        </nav>

        {children}
      </body>
    </html>
  );
}