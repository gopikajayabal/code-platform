import Link from "next/link";

export default function HomePage() {
  return (
    <main
      style={{
        background: "linear-gradient(135deg, #020617, #0f172a)",
        color: "white",
        minHeight: "100vh",
        padding: "60px 40px",
      }}
    >
      <section
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
          textAlign: "center",
          paddingTop: "80px",
        }}
      >
        <h1
          style={{
            fontSize: "56px",
            lineHeight: "1.1",
            marginBottom: "20px",
          }}
        >
          Build Your Coding Skills with{" "}
          <span style={{ color: "#60a5fa" }}>Code Platform</span>
        </h1>

        <p
          style={{
            color: "#94a3b8",
            fontSize: "20px",
            maxWidth: "720px",
            margin: "0 auto",
            lineHeight: "1.7",
          }}
        >
          Practice coding problems, filter by difficulty, write code in a
          VS Code-style editor, and track your progress.
        </p>

        <div
          style={{
            marginTop: "36px",
            display: "flex",
            justifyContent: "center",
            gap: "16px",
          }}
        >
          <Link href="/problems" style={primaryButton}>
            Start Solving
          </Link>

          <Link href="/dashboard" style={secondaryButton}>
            View Dashboard
          </Link>
        </div>

        <div
          style={{
            marginTop: "70px",
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "20px",
          }}
        >
          <div style={card}>
            <h2>Problems</h2>
            <p>Practice Easy, Medium, and Hard coding questions.</p>
          </div>

          <div style={card}>
            <h2>Editor</h2>
            <p>Write code using a professional Monaco code editor.</p>
          </div>

          <div style={card}>
            <h2>Dashboard</h2>
            <p>Track total problems and platform activity.</p>
          </div>
        </div>
      </section>
    </main>
  );
}

const primaryButton = {
  background: "#2563eb",
  color: "white",
  padding: "14px 24px",
  borderRadius: "10px",
  textDecoration: "none",
  fontWeight: "bold",
};

const secondaryButton = {
  background: "#0f172a",
  color: "white",
  padding: "14px 24px",
  borderRadius: "10px",
  textDecoration: "none",
  border: "1px solid #334155",
  fontWeight: "bold",
};

const card = {
  background: "#0f172a",
  border: "1px solid #334155",
  borderRadius: "16px",
  padding: "24px",
  textAlign: "left" as const,
};