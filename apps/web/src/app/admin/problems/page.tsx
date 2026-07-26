"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type User = {
  username: string;
  role?: "USER" | "ADMIN";
};

type Difficulty = "EASY" | "MEDIUM" | "HARD";

type TestCaseForm = {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
  order: number;
};

type Problem = {
  id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: Difficulty;
  language: string;
  topic: string;
  timeLimit?: number;
  memoryLimit?: number;
  testCases?: TestCaseForm[];
};

type ProblemsResponse = {
  success?: boolean;
  problems?: Problem[];
  error?: string;
};

const API_URL = "http://localhost:5000";

function createEmptyTestCase(
  order: number,
  isHidden = true
): TestCaseForm {
  return {
    input: "",
    expectedOutput: "",
    isHidden,
    order,
  };
}

export default function AdminProblemsPage() {
  const [allowed, setAllowed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [loadingProblems, setLoadingProblems] =
    useState(false);
  const [saving, setSaving] = useState(false);

  const [problems, setProblems] = useState<Problem[]>([]);
  const [editingId, setEditingId] = useState("");

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] =
    useState<Difficulty>("EASY");
  const [language, setLanguage] = useState("C");
  const [topic, setTopic] = useState("Arrays");
  const [timeLimit, setTimeLimit] = useState("2");
  const [memoryLimit, setMemoryLimit] = useState("256");

  const [replaceTestCases, setReplaceTestCases] =
    useState(false);

  const [testCases, setTestCases] = useState<TestCaseForm[]>([
    createEmptyTestCase(1, false),
    createEmptyTestCase(2, true),
  ]);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "success" | "error" | ""
  >("");

  useEffect(() => {
    const savedUser = localStorage.getItem("user");

    if (savedUser) {
      try {
        const user: User = JSON.parse(savedUser);
        setAllowed(user.role === "ADMIN");
      } catch {
        setAllowed(false);
      }
    }

    setChecking(false);
  }, []);

  useEffect(() => {
    if (allowed) {
      loadProblems();
    }
  }, [allowed]);

  async function loadProblems() {
    try {
      setLoadingProblems(true);

      const response = await fetch(
        `${API_URL}/api/problems`,
        {
          cache: "no-store",
        }
      );

      const data =
        (await response.json()) as ProblemsResponse;

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to load problems"
        );
      }

      setProblems(data.problems || []);
    } catch (error) {
      setMessageType("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to load problems"
      );
    } finally {
      setLoadingProblems(false);
    }
  }

  function resetForm() {
    setEditingId("");
    setTitle("");
    setSlug("");
    setDescription("");
    setDifficulty("EASY");
    setLanguage("C");
    setTopic("Arrays");
    setTimeLimit("2");
    setMemoryLimit("256");
    setReplaceTestCases(false);

    setTestCases([
      createEmptyTestCase(1, false),
      createEmptyTestCase(2, true),
    ]);
  }

  function generateSlug(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function handleTitleChange(value: string) {
    setTitle(value);

    if (!editingId) {
      setSlug(generateSlug(value));
    }
  }

  function addTestCase() {
    setTestCases((current) => [
      ...current,
      createEmptyTestCase(current.length + 1, true),
    ]);
  }

  function removeTestCase(index: number) {
    if (testCases.length <= 1) {
      setMessageType("error");
      setMessage("At least one test case is required.");
      return;
    }

    setTestCases((current) =>
      current
        .filter((_, itemIndex) => itemIndex !== index)
        .map((testCase, itemIndex) => ({
          ...testCase,
          order: itemIndex + 1,
        }))
    );
  }

  function updateTestCase(
    index: number,
    field: keyof TestCaseForm,
    value: string | boolean | number
  ) {
    setTestCases((current) =>
      current.map((testCase, itemIndex) =>
        itemIndex === index
          ? {
              ...testCase,
              [field]: value,
            }
          : testCase
      )
    );
  }

  function validateForm(): string | null {
    if (!title.trim()) {
      return "Title is required.";
    }

    if (!slug.trim()) {
      return "Slug is required.";
    }

    if (!description.trim()) {
      return "Description is required.";
    }

    if (!topic.trim()) {
      return "Topic is required.";
    }

    if (
      Number.isNaN(Number(timeLimit)) ||
      Number(timeLimit) <= 0
    ) {
      return "Time limit must be greater than 0.";
    }

    if (
      Number.isNaN(Number(memoryLimit)) ||
      Number(memoryLimit) <= 0
    ) {
      return "Memory limit must be greater than 0.";
    }

    const shouldValidateTestCases =
      !editingId || replaceTestCases;

    if (shouldValidateTestCases) {
      if (testCases.length === 0) {
        return "At least one test case is required.";
      }

      const invalidTestCase = testCases.find(
        (testCase) =>
          !testCase.input.trim() ||
          !testCase.expectedOutput.trim()
      );

      if (invalidTestCase) {
        return `Test Case ${invalidTestCase.order} must contain input and expected output.`;
      }

      const hasPublicTestCase = testCases.some(
        (testCase) => !testCase.isHidden
      );

      if (!hasPublicTestCase) {
        return "At least one public sample test case is required.";
      }
    }

    return null;
  }

  async function saveProblem() {
    const validationError = validateForm();

    if (validationError) {
      setMessageType("error");
      setMessage(validationError);
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      setMessageType("error");
      setMessage("Admin login token is missing.");
      return;
    }

    const body: Record<string, unknown> = {
      title: title.trim(),
      slug: slug.trim().toLowerCase(),
      description: description.trim(),
      difficulty,
      language,
      topic: topic.trim(),
      timeLimit: Number(timeLimit),
      memoryLimit: Number(memoryLimit),
    };

    if (!editingId || replaceTestCases) {
      body.testCases = testCases.map(
        (testCase, index) => ({
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          isHidden: testCase.isHidden,
          order: index + 1,
        })
      );
    }

    const url = editingId
      ? `${API_URL}/api/problems/${editingId}`
      : `${API_URL}/api/problems`;

    const method = editingId ? "PUT" : "POST";

    try {
      setSaving(true);
      setMessage("");

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            data.error ||
            "Problem action failed"
        );
      }

      setMessageType("success");
      setMessage(
        editingId
          ? "Problem updated successfully."
          : "Problem and test cases created successfully."
      );

      resetForm();
      await loadProblems();
    } catch (error) {
      setMessageType("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Problem action failed"
      );
    } finally {
      setSaving(false);
    }
  }

  function editProblem(problem: Problem) {
    setEditingId(problem.id);
    setTitle(problem.title);
    setSlug(problem.slug);
    setDescription(problem.description);
    setDifficulty(problem.difficulty);
    setLanguage(problem.language || "GENERAL");
    setTopic(problem.topic || "General");
    setTimeLimit(String(problem.timeLimit || 2));
    setMemoryLimit(String(problem.memoryLimit || 256));

    setReplaceTestCases(false);

    setTestCases([
      createEmptyTestCase(1, false),
      createEmptyTestCase(2, true),
    ]);

    setMessageType("");
    setMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function deleteProblem(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this problem? Its test cases and submissions will also be deleted."
    );

    if (!confirmed) {
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      setMessageType("error");
      setMessage("Admin login token is missing.");
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/problems/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Problem deletion failed"
        );
      }

      setMessageType("success");
      setMessage("Problem deleted successfully.");

      if (editingId === id) {
        resetForm();
      }

      await loadProblems();
    } catch (error) {
      setMessageType("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Problem deletion failed"
      );
    }
  }

  if (checking) {
    return (
      <main style={pageStyle}>
        <h1>Checking admin access...</h1>
      </main>
    );
  }

  if (!allowed) {
    return (
      <main style={pageStyle}>
        <h1>Access Denied</h1>

        <p style={mutedTextStyle}>
          You do not have admin permission to access this
          page.
        </p>

        <Link href="/problems" style={linkStyle}>
          Back to Problems
        </Link>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <div style={headerStyle}>
        <div>
          <h1 style={{ marginBottom: "8px" }}>
            {editingId
              ? "Edit Coding Problem"
              : "Create Coding Problem"}
          </h1>

          <p style={mutedTextStyle}>
            Add problem details, execution limits and public
            or hidden test cases.
          </p>
        </div>

        <Link href="/problems" style={backButtonStyle}>
          View Problems
        </Link>
      </div>

      {message && (
        <div
          style={{
            ...messageStyle,
            borderColor:
              messageType === "success"
                ? "#22c55e"
                : "#ef4444",
            background:
              messageType === "success"
                ? "#052e16"
                : "#450a0a",
            color:
              messageType === "success"
                ? "#bbf7d0"
                : "#fecaca",
          }}
        >
          {message}
        </div>
      )}

      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Problem Information</h2>

        <div style={gridStyle}>
          <div style={fieldStyle}>
            <label style={labelStyle}>Title</label>

            <input
              placeholder="Example: Array Sum"
              value={title}
              onChange={(event) =>
                handleTitleChange(event.target.value)
              }
              style={inputStyle}
            />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Slug</label>

            <input
              placeholder="array-sum"
              value={slug}
              onChange={(event) =>
                setSlug(generateSlug(event.target.value))
              }
              style={inputStyle}
            />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Difficulty</label>

            <select
              value={difficulty}
              onChange={(event) =>
                setDifficulty(
                  event.target.value as Difficulty
                )
              }
              style={inputStyle}
            >
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Language</label>

            <select
              value={language}
              onChange={(event) =>
                setLanguage(event.target.value)
              }
              style={inputStyle}
            >
              <option value="C">C</option>
              <option value="C++">C++</option>
              <option value="Java">Java</option>
              <option value="Python">Python</option>
              <option value="JavaScript">
                JavaScript
              </option>
              <option value="GENERAL">General</option>
            </select>
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Topic</label>

            <input
              placeholder="Example: Arrays"
              value={topic}
              onChange={(event) =>
                setTopic(event.target.value)
              }
              style={inputStyle}
            />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>
              Time Limit (seconds)
            </label>

            <input
              type="number"
              min="0.1"
              step="0.1"
              value={timeLimit}
              onChange={(event) =>
                setTimeLimit(event.target.value)
              }
              style={inputStyle}
            />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>
              Memory Limit (MB)
            </label>

            <input
              type="number"
              min="1"
              value={memoryLimit}
              onChange={(event) =>
                setMemoryLimit(event.target.value)
              }
              style={inputStyle}
            />
          </div>
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>
            Description, Input Format, Output Format and
            Constraints
          </label>

          <textarea
            placeholder={`Problem Description

Input Format:
...

Output Format:
...

Constraints:
...

Example:
Input:
5
2 7 11 15 3

Output:
38`}
            value={description}
            onChange={(event) =>
              setDescription(event.target.value)
            }
            style={{
              ...inputStyle,
              minHeight: "260px",
              fontFamily: "monospace",
              resize: "vertical",
            }}
          />
        </div>
      </section>

      {editingId && (
        <section style={sectionStyle}>
          <h2 style={sectionTitleStyle}>
            Test Case Update Option
          </h2>

          <label style={checkboxRowStyle}>
            <input
              type="checkbox"
              checked={replaceTestCases}
              onChange={(event) =>
                setReplaceTestCases(event.target.checked)
              }
            />

            <span>
              Replace all existing test cases with the test
              cases entered below.
            </span>
          </label>

          <p style={warningTextStyle}>
            Leave this unchecked when you only want to update
            the title, description or other problem details.
          </p>
        </section>
      )}

      {(!editingId || replaceTestCases) && (
        <section style={sectionStyle}>
          <div style={testCaseHeaderStyle}>
            <div>
              <h2 style={sectionTitleStyle}>Test Cases</h2>

              <p style={mutedTextStyle}>
                Public test cases are shown to users. Hidden
                test cases are used only during Submit Code.
              </p>
            </div>

            <button
              type="button"
              onClick={addTestCase}
              style={addButtonStyle}
            >
              + Add Test Case
            </button>
          </div>

          <div style={testCaseListStyle}>
            {testCases.map((testCase, index) => (
              <div key={index} style={testCaseCardStyle}>
                <div style={testCaseTitleRowStyle}>
                  <h3 style={{ margin: 0 }}>
                    Test Case {index + 1}
                  </h3>

                  <button
                    type="button"
                    onClick={() => removeTestCase(index)}
                    style={removeButtonStyle}
                  >
                    Remove
                  </button>
                </div>

                <label style={checkboxRowStyle}>
                  <input
                    type="checkbox"
                    checked={testCase.isHidden}
                    onChange={(event) =>
                      updateTestCase(
                        index,
                        "isHidden",
                        event.target.checked
                      )
                    }
                  />

                  <span>
                    Hidden Test Case
                    {!testCase.isHidden &&
                      " — visible as sample input/output"}
                  </span>
                </label>

                <div style={testCaseGridStyle}>
                  <div style={fieldStyle}>
                    <label style={labelStyle}>Input</label>

                    <textarea
                      placeholder={`5
2 7 11 15 3`}
                      value={testCase.input}
                      onChange={(event) =>
                        updateTestCase(
                          index,
                          "input",
                          event.target.value
                        )
                      }
                      style={codeTextareaStyle}
                    />
                  </div>

                  <div style={fieldStyle}>
                    <label style={labelStyle}>
                      Expected Output
                    </label>

                    <textarea
                      placeholder="38"
                      value={testCase.expectedOutput}
                      onChange={(event) =>
                        updateTestCase(
                          index,
                          "expectedOutput",
                          event.target.value
                        )
                      }
                      style={codeTextareaStyle}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div style={actionRowStyle}>
        <button
          type="button"
          onClick={saveProblem}
          disabled={saving}
          style={{
            ...primaryButtonStyle,
            opacity: saving ? 0.6 : 1,
            cursor: saving ? "not-allowed" : "pointer",
          }}
        >
          {saving
            ? "Saving..."
            : editingId
              ? "Update Problem"
              : "Create Problem"}
        </button>

        {editingId && (
          <button
            type="button"
            onClick={resetForm}
            disabled={saving}
            style={secondaryButtonStyle}
          >
            Cancel Editing
          </button>
        )}
      </div>

      <section style={sectionStyle}>
        <div style={manageHeaderStyle}>
          <div>
            <h2 style={sectionTitleStyle}>
              Manage Problems
            </h2>

            <p style={mutedTextStyle}>
              Total problems: {problems.length}
            </p>
          </div>

          <button
            type="button"
            onClick={loadProblems}
            disabled={loadingProblems}
            style={secondaryButtonStyle}
          >
            {loadingProblems ? "Loading..." : "Refresh"}
          </button>
        </div>

        {loadingProblems ? (
          <p style={mutedTextStyle}>
            Loading problems...
          </p>
        ) : problems.length === 0 ? (
          <div style={emptyStyle}>
            No problems available. Create your first problem.
          </div>
        ) : (
          <div style={problemListStyle}>
            {problems.map((problem) => (
              <div key={problem.id} style={problemCardStyle}>
                <div>
                  <strong style={{ fontSize: "17px" }}>
                    {problem.title}
                  </strong>

                  <p style={problemMetaStyle}>
                    {problem.language} • {problem.topic} •{" "}
                    {problem.difficulty}
                  </p>

                  <p style={problemSlugStyle}>
                    /problems/{problem.slug}
                  </p>
                </div>

                <div style={cardActionStyle}>
                  <Link
                    href={`/problems/${problem.slug}`}
                    style={viewButtonStyle}
                  >
                    View
                  </Link>

                  <button
                    type="button"
                    onClick={() => editProblem(problem)}
                    style={editButtonStyle}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      deleteProblem(problem.id)
                    }
                    style={deleteButtonStyle}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

const pageStyle = {
  background: "#020617",
  color: "white",
  minHeight: "100vh",
  padding: "32px",
};

const headerStyle = {
  maxWidth: "1200px",
  margin: "0 auto 24px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "16px",
  flexWrap: "wrap" as const,
};

const sectionStyle = {
  maxWidth: "1200px",
  margin: "0 auto 24px",
  padding: "22px",
  background: "#0f172a",
  border: "1px solid #334155",
  borderRadius: "14px",
};

const sectionTitleStyle = {
  marginTop: 0,
  marginBottom: "10px",
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(240px, 1fr))",
  gap: "16px",
  marginBottom: "16px",
};

const fieldStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "8px",
};

const labelStyle = {
  color: "#e2e8f0",
  fontWeight: 600,
};

const inputStyle = {
  width: "100%",
  padding: "12px",
  borderRadius: "9px",
  border: "1px solid #334155",
  background: "#020617",
  color: "white",
  boxSizing: "border-box" as const,
};

const codeTextareaStyle = {
  ...inputStyle,
  minHeight: "130px",
  resize: "vertical" as const,
  fontFamily: "monospace",
};

const mutedTextStyle = {
  color: "#94a3b8",
  marginTop: 0,
};

const warningTextStyle = {
  color: "#fbbf24",
  marginBottom: 0,
};

const linkStyle = {
  color: "#60a5fa",
};

const backButtonStyle = {
  padding: "10px 14px",
  background: "#1e293b",
  color: "white",
  borderRadius: "8px",
  textDecoration: "none",
  border: "1px solid #475569",
};

const messageStyle = {
  maxWidth: "1200px",
  margin: "0 auto 24px",
  padding: "14px",
  border: "1px solid",
  borderRadius: "10px",
};

const checkboxRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  color: "#cbd5e1",
};

const testCaseHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "16px",
  flexWrap: "wrap" as const,
};

const testCaseListStyle = {
  display: "grid",
  gap: "18px",
  marginTop: "20px",
};

const testCaseCardStyle = {
  padding: "18px",
  background: "#020617",
  border: "1px solid #334155",
  borderRadius: "12px",
};

const testCaseTitleRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  marginBottom: "14px",
};

const testCaseGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(280px, 1fr))",
  gap: "16px",
  marginTop: "14px",
};

const primaryButtonStyle = {
  padding: "13px 20px",
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: "9px",
  fontWeight: 700,
};

const secondaryButtonStyle = {
  padding: "11px 16px",
  background: "#475569",
  color: "white",
  border: "none",
  borderRadius: "9px",
  cursor: "pointer",
};

const addButtonStyle = {
  padding: "11px 16px",
  background: "#16a34a",
  color: "white",
  border: "none",
  borderRadius: "9px",
  cursor: "pointer",
  fontWeight: 700,
};

const removeButtonStyle = {
  padding: "8px 12px",
  background: "#7f1d1d",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
};

const actionRowStyle = {
  maxWidth: "1200px",
  margin: "0 auto 24px",
  display: "flex",
  gap: "12px",
  flexWrap: "wrap" as const,
};

const manageHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "14px",
  flexWrap: "wrap" as const,
};

const problemListStyle = {
  display: "grid",
  gap: "12px",
  marginTop: "18px",
};

const problemCardStyle = {
  background: "#020617",
  border: "1px solid #334155",
  borderRadius: "12px",
  padding: "16px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "16px",
  flexWrap: "wrap" as const,
};

const problemMetaStyle = {
  color: "#94a3b8",
  margin: "7px 0",
};

const problemSlugStyle = {
  color: "#64748b",
  margin: 0,
  fontFamily: "monospace",
};

const cardActionStyle = {
  display: "flex",
  gap: "9px",
  flexWrap: "wrap" as const,
};

const viewButtonStyle = {
  padding: "8px 12px",
  background: "#0f766e",
  color: "white",
  textDecoration: "none",
  borderRadius: "8px",
};

const editButtonStyle = {
  padding: "8px 12px",
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
};

const deleteButtonStyle = {
  padding: "8px 12px",
  background: "#dc2626",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
};

const emptyStyle = {
  marginTop: "18px",
  padding: "24px",
  textAlign: "center" as const,
  color: "#94a3b8",
  border: "1px dashed #475569",
  borderRadius: "10px",
};