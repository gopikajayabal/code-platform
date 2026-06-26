"use client";

import { useState } from "react";
import Editor from "@monaco-editor/react";

type CodeEditorProps = {
  problemId: string;
};

export default function CodeEditor({ problemId }: CodeEditorProps) {
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState(`function twoSum(nums, target) {
  return [0, 1];
}

console.log(twoSum([2,7,11,15], 9));`);
  const [output, setOutput] = useState("");

  async function runCode() {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Please login to run and save your code.");
      window.location.href = "/login";
      return;
    }

    let runOutput = "";

    if (language !== "javascript") {
      runOutput =
        "Code saved. Real execution for this language will be added with Judge0.";
      setOutput(runOutput);
    } else {
      try {
        const logs: string[] = [];

        const customConsole = {
          log: (...args: unknown[]) => {
            logs.push(
              args
                .map((item) =>
                  typeof item === "string" ? item : JSON.stringify(item)
                )
                .join(" ")
            );
          },
        };

        new Function("console", code)(customConsole);

        runOutput = logs.length
          ? logs.join("\n")
          : "Code executed successfully.";

        setOutput(runOutput);
      } catch (error: unknown) {
        runOutput = error instanceof Error ? error.message : "Runtime error";
        setOutput(runOutput);
      }
    }

    try {
      const response = await fetch("http://localhost:5000/api/submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          problemId,
          language,
          code,
          output: runOutput,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setOutput((current) => `${current}\n\nSubmission saved successfully.`);
      } else {
        setOutput((current) => `${current}\n\nSubmission save failed.`);
      }
    } catch {
      setOutput((current) => `${current}\n\nBackend connection failed.`);
    }
  }

  return (
    <div
      style={{
        background: "#0f172a",
        border: "1px solid #334155",
        borderRadius: "12px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "12px",
          borderBottom: "1px solid #334155",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          style={{
            background: "#020617",
            color: "white",
            padding: "8px",
            borderRadius: "6px",
          }}
        >
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
          <option value="cpp">C++</option>
        </select>

        <button
          onClick={runCode}
          style={{
            background: "#22c55e",
            color: "white",
            padding: "8px 18px",
            borderRadius: "6px",
            border: "none",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Run & Save
        </button>
      </div>

      <Editor
        height="350px"
        language={language}
        theme="vs-dark"
        value={code}
        onChange={(value) => setCode(value || "")}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          automaticLayout: true,
        }}
      />

      <div
        style={{
          padding: "16px",
          borderTop: "1px solid #334155",
          background: "#020617",
          minHeight: "100px",
        }}
      >
        <h3 style={{ marginTop: 0 }}>Output</h3>
        <pre style={{ whiteSpace: "pre-wrap", color: "#cbd5e1" }}>
          {output}
        </pre>
      </div>
    </div>
  );
}