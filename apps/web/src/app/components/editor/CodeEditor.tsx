"use client";

import { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";

type CodeEditorProps = {
  problemId: string;
  initialLanguage?: string;
};

type SubmissionMode = "run" | "submit";

type ExecutionResult = {
  output?: string;
  stdout?: string | null;
  stderr?: string | null;
  compileOutput?: string | null;
  message?: string | null;
  error?: string | null;
  status?: string;
  statusId?: number;
  passedTests?: number;
  totalTests?: number;
  time?: string | number | null;
  memory?: number | null;
  inputUsed?: string;
};

type SubmissionResponse = {
  success: boolean;
  error?: string;
  message?: string;
  execution?: ExecutionResult;
};

const templates: Record<string, string> = {
  javascript: `// Write your JavaScript code here

console.log("Hello World");
`,

  python: `# Write your Python code here

print("Hello World")
`,

  java: `public class Main {
    public static void main(String[] args) {
        // Write your Java code here
        System.out.println("Hello World");
    }
}
`,

  cpp: `#include <iostream>
using namespace std;

int main() {
    // Write your C++ code here
    cout << "Hello World";

    return 0;
}
`,

  c: `#include <stdio.h>

int main() {
    // Write your C code here
    printf("Hello World");

    return 0;
}
`,

  html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    <title>HTML Preview</title>

    <style>
        body {
            font-family: Arial, sans-serif;
            padding: 30px;
        }

        h1 {
            color: #2563eb;
        }
    </style>
</head>

<body>
    <h1>Hello Gopika</h1>
    <p>Edit this HTML and click Run Preview.</p>
</body>
</html>
`,

  css: `body {
    background-color: white;
    color: black;
    font-family: Arial, sans-serif;
    padding: 30px;
}

h1 {
    color: blue;
}

button {
    padding: 10px 18px;
}
`,

  sql: `SELECT * FROM users;
`,
};

function normalizeLanguage(language?: string): string {
  const value = (language || "javascript")
    .trim()
    .toLowerCase();

  const languageMap: Record<string, string> = {
    c: "c",
    "c++": "cpp",
    cpp: "cpp",
    java: "java",
    python: "python",
    javascript: "javascript",
    js: "javascript",
    html: "html",
    css: "css",
    sql: "sql",
  };

  return languageMap[value] || "javascript";
}

function containsOnlyStarterCode(
  language: string,
  code: string
): boolean {
  return (
    code.trim() ===
    (templates[language] || "").trim()
  );
}

function formatStatus(status?: string): string {
  if (!status) {
    return "Unknown";
  }

  return status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

export default function CodeEditor({
  problemId,
  initialLanguage,
}: CodeEditorProps) {
  const normalizedInitialLanguage =
    normalizeLanguage(initialLanguage);

  const [language, setLanguage] = useState(
    normalizedInitialLanguage
  );

  const [code, setCode] = useState(
    templates[normalizedInitialLanguage] ||
      templates.javascript
  );

  const [stdin, setStdin] = useState("");
  const [output, setOutput] = useState("");

  const [htmlPreview, setHtmlPreview] =
    useState("");

  const [cssPreview, setCssPreview] =
    useState("");

  const [activeMode, setActiveMode] =
    useState<SubmissionMode | null>(null);

  const isProcessing = activeMode !== null;

  useEffect(() => {
    const selectedLanguage =
      normalizeLanguage(initialLanguage);

    setLanguage(selectedLanguage);

    setCode(
      templates[selectedLanguage] ||
        templates.javascript
    );

    setStdin("");
    setOutput("");
    setHtmlPreview("");
    setCssPreview("");
  }, [initialLanguage]);

  function handleLanguageChange(
    selectedLanguage: string
  ) {
    setLanguage(selectedLanguage);

    setCode(
      templates[selectedLanguage] || ""
    );

    setStdin("");
    setOutput("");
    setHtmlPreview("");
    setCssPreview("");
  }

  function handleInvalidSession(message: string) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.clear();

    alert(message);

    window.location.href = "/login";
  }

  async function execute(
    mode: SubmissionMode
  ) {
    const token =
      localStorage.getItem("token");

    if (!token) {
      handleInvalidSession(
        "Please login to run or submit your code."
      );

      return;
    }

    if (!problemId) {
      setOutput("Problem ID is missing.");
      return;
    }

    if (!code.trim()) {
      setOutput(
        "Please write code before running."
      );

      return;
    }

    if (
      containsOnlyStarterCode(language, code) &&
      language !== "html" &&
      language !== "css"
    ) {
      setOutput(
        "Please write your solution before running the code."
      );

      return;
    }

    // HTML Run Preview
    if (
      language === "html" &&
      mode === "run"
    ) {
      setHtmlPreview(code);

      setOutput(
        "HTML preview generated successfully."
      );

      return;
    }

    // CSS Run Preview
    if (
      language === "css" &&
      mode === "run"
    ) {
      const previewDocument = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  >

  <style>
    ${code}
  </style>
</head>

<body>
  <div class="container">
    <h1>CSS Preview</h1>

    <p>
      Edit the CSS and click Run Preview.
    </p>

    <input
      type="text"
      placeholder="Sample Input"
    >

    <button type="button">
      Sample Button
    </button>

    <div class="box">
      Sample Box
    </div>
  </div>
</body>
</html>
`;

      setCssPreview(previewDocument);

      setOutput(
        "CSS preview generated successfully."
      );

      return;
    }

    // SQL will be implemented separately
    if (language === "sql") {
      setOutput(
        "SQL execution support will be added in the next step."
      );

      return;
    }

    setActiveMode(mode);

    setOutput(
      mode === "run"
        ? "Running code..."
        : "Submitting code against test cases..."
    );

    try {
      const response = await fetch(
        "http://localhost:5000/api/submissions",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            problemId,
            language,
            code,
            stdin,
            mode,
          }),
        }
      );

      const data =
        (await response.json()) as SubmissionResponse;

      if (response.status === 401) {
        handleInvalidSession(
          data.error ||
            data.message ||
            "Your login session is invalid. Please login again."
        );

        return;
      }

      if (!response.ok || !data.success) {
        setOutput(
          data.error ||
            data.message ||
            "Code execution failed."
        );

        return;
      }

      const execution = data.execution;

      if (!execution) {
        setOutput(
          data.message ||
            "Execution result was not returned."
        );

        return;
      }

      const resultText =
        execution.stdout ||
        execution.compileOutput ||
        execution.stderr ||
        execution.error ||
        execution.message ||
        execution.output ||
        data.message ||
        "No output";

      const details: string[] = [];

      details.push(
        `Status: ${formatStatus(
          execution.status
        )}`
      );

      if (
        typeof execution.passedTests ===
          "number" &&
        typeof execution.totalTests ===
          "number" &&
        execution.totalTests > 0
      ) {
        details.push(
          `Passed Tests: ${execution.passedTests}/${execution.totalTests}`
        );
      }

      if (
        execution.time !== null &&
        execution.time !== undefined
      ) {
        details.push(
          `Time: ${execution.time} seconds`
        );
      }

      if (
        execution.memory !== null &&
        execution.memory !== undefined
      ) {
        details.push(
          `Memory: ${execution.memory} KB`
        );
      }

      if (
        mode === "run" &&
        execution.inputUsed &&
        execution.inputUsed.trim()
      ) {
        details.push(
          `Input Used:\n${execution.inputUsed.trim()}`
        );
      }

      const completionMessage =
        mode === "submit"
          ? "Submission evaluated and saved successfully."
          : "Code executed and saved successfully.";

      setOutput(
        `${resultText.trim()}\n\n${details.join(
          "\n"
        )}\n\n${completionMessage}`
      );
    } catch (error) {
      setOutput(
        error instanceof Error
          ? `Backend connection failed:\n${error.message}`
          : "Backend connection failed."
      );
    } finally {
      setActiveMode(null);
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
          borderBottom:
            "1px solid #334155",
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <select
          value={language}
          onChange={(event) =>
            handleLanguageChange(
              event.target.value
            )
          }
          disabled={isProcessing}
          style={{
            background: "#020617",
            color: "white",
            padding: "8px",
            borderRadius: "6px",
            border:
              "1px solid #334155",
          }}
        >
          <option value="javascript">
            JavaScript
          </option>

          <option value="python">
            Python
          </option>

          <option value="java">
            Java
          </option>

          <option value="cpp">
            C++
          </option>

          <option value="c">
            C
          </option>

          <option value="html">
            HTML
          </option>

          <option value="css">
            CSS
          </option>

          <option value="sql">
            SQL
          </option>
        </select>

        <div
          style={{
            display: "flex",
            gap: "10px",
          }}
        >
          <button
            type="button"
            onClick={() =>
              execute("run")
            }
            disabled={isProcessing}
            style={{
              background:
                activeMode === "run"
                  ? "#64748b"
                  : "#2563eb",

              color: "white",
              padding: "8px 18px",
              borderRadius: "6px",
              border: "none",

              cursor: isProcessing
                ? "not-allowed"
                : "pointer",

              fontWeight: "bold",
            }}
          >
            {activeMode === "run"
              ? "Running..."
              : language === "html" ||
                  language === "css"
                ? "Run Preview"
                : "Run Code"}
          </button>

          <button
            type="button"
            onClick={() =>
              execute("submit")
            }
            disabled={isProcessing}
            style={{
              background:
                activeMode === "submit"
                  ? "#64748b"
                  : "#22c55e",

              color: "white",
              padding: "8px 18px",
              borderRadius: "6px",
              border: "none",

              cursor: isProcessing
                ? "not-allowed"
                : "pointer",

              fontWeight: "bold",
            }}
          >
            {activeMode === "submit"
              ? "Submitting..."
              : "Submit Code"}
          </button>
        </div>
      </div>

      <Editor
        height="350px"
        language={language}
        theme="vs-dark"
        value={code}
        onChange={(value) =>
          setCode(value || "")
        }
        options={{
          minimap: {
            enabled: false,
          },

          fontSize: 14,
          automaticLayout: true,
          scrollBeyondLastLine: false,
          wordWrap: "on",
        }}
      />

      {language !== "html" &&
        language !== "css" && (
          <div
            style={{
              padding: "16px",
              borderTop:
                "1px solid #334155",
              background: "#0f172a",
            }}
          >
            <label
              htmlFor="stdin"
              style={{
                display: "block",
                color: "white",
                marginBottom: "8px",
                fontWeight: "bold",
              }}
            >
              Custom Input
            </label>

            <textarea
              id="stdin"
              value={stdin}
              onChange={(event) =>
                setStdin(
                  event.target.value
                )
              }
              disabled={isProcessing}
              placeholder="Enter custom input for Run Code. Submit Code uses saved test cases."
              style={{
                width: "100%",
                minHeight: "90px",
                resize: "vertical",
                background: "#020617",
                color: "#cbd5e1",
                border:
                  "1px solid #334155",
                borderRadius: "6px",
                padding: "10px",
                boxSizing: "border-box",
              }}
            />
          </div>
        )}

      {language === "html" &&
        htmlPreview && (
          <div
            style={{
              padding: "16px",
              borderTop:
                "1px solid #334155",
              background: "#0f172a",
            }}
          >
            <h3
              style={{
                color: "white",
                marginTop: 0,
              }}
            >
              HTML Live Preview
            </h3>

            <iframe
              title="HTML Live Preview"
              srcDoc={htmlPreview}
              sandbox="allow-scripts"
              style={{
                width: "100%",
                minHeight: "320px",
                background: "white",
                border:
                  "1px solid #334155",
                borderRadius: "8px",
              }}
            />
          </div>
        )}

      {language === "css" &&
        cssPreview && (
          <div
            style={{
              padding: "16px",
              borderTop:
                "1px solid #334155",
              background: "#0f172a",
            }}
          >
            <h3
              style={{
                color: "white",
                marginTop: 0,
              }}
            >
              CSS Live Preview
            </h3>

            <iframe
              title="CSS Live Preview"
              srcDoc={cssPreview}
              sandbox=""
              style={{
                width: "100%",
                minHeight: "350px",
                border:
                  "1px solid #334155",
                borderRadius: "8px",
                background: "white",
              }}
            />
          </div>
        )}

      <div
        style={{
          padding: "16px",
          borderTop:
            "1px solid #334155",
          background: "#020617",
          minHeight: "140px",
        }}
      >
        <h3
          style={{
            marginTop: 0,
            color: "white",
          }}
        >
          Output
        </h3>

        <pre
          style={{
            whiteSpace: "pre-wrap",
            overflowWrap: "anywhere",
            color: "#cbd5e1",
            marginBottom: 0,
          }}
        >
          {output ||
            "Run or submit your code to see the result."}
        </pre>
      </div>
    </div>
  );
}