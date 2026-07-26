import {
  Difficulty,
  PrismaClient,
} from "@prisma/client";

const prisma = new PrismaClient();

const LANGUAGES = [
  "C",
  "C++",
  "Java",
  "Python",
  "JavaScript",
  "HTML",
  "CSS",
  "SQL",
] as const;

const TOPICS = [
  "Basics",
  "Input Output",
  "Operators",
  "Conditions",
  "Loops",
  "Arrays",
  "Strings",
  "Functions",
  "Recursion",
  "Mathematics",
  "Searching",
  "Sorting",
  "Two Pointers",
  "Sliding Window",
  "Hashing",
  "Stack",
  "Queue",
  "Linked List",
  "Trees",
  "Graphs",
  "Dynamic Programming",
  "Greedy",
  "Backtracking",
  "Bit Manipulation",
  "Number Theory",
];

type SeedProblem = {
  title: string;
  slug: string;
  description: string;
  difficulty: Difficulty;
  language: string;
  topic: string;
  timeLimit: number;
  memoryLimit: number;
  solvedCount: number;
  totalCount: number;
};

type SeedTestCase = {
  problemId: string;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
  order: number;
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/\+/g, "plus")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getDifficulty(index: number): Difficulty {
  const position = index % 300;

  if (position < 60) {
    return Difficulty.EASY;
  }

  if (position < 240) {
    return Difficulty.MEDIUM;
  }

  return Difficulty.HARD;
}

function getTask(index: number) {
  const taskNumber = index % 10;
  const value = (index % 20) + 1;

  switch (taskNumber) {
    case 0:
      return {
        name: `Add ${value} To A Number`,
        statement: `Read one integer and print the value after adding ${value}.`,
        input1: "10",
        output1: String(10 + value),
        input2: "25",
        output2: String(25 + value),
      };

    case 1:
      return {
        name: `Multiply A Number By ${value}`,
        statement: `Read one integer and print the value multiplied by ${value}.`,
        input1: "4",
        output1: String(4 * value),
        input2: "7",
        output2: String(7 * value),
      };

    case 2:
      return {
        name: "Check Even Or Odd",
        statement:
          "Read one integer. Print EVEN when the number is even; otherwise print ODD.",
        input1: "8",
        output1: "EVEN",
        input2: "11",
        output2: "ODD",
      };

    case 3:
      return {
        name: "Find Maximum Of Two Numbers",
        statement:
          "Read two integers and print the larger value.",
        input1: "10 25",
        output1: "25",
        input2: "50 12",
        output2: "50",
      };

    case 4:
      return {
        name: "Calculate Square Of A Number",
        statement:
          "Read one integer and print its square.",
        input1: "6",
        output1: "36",
        input2: "12",
        output2: "144",
      };

    case 5:
      return {
        name: "Calculate Sum From One To N",
        statement:
          "Read a positive integer n and print the sum of integers from 1 to n.",
        input1: "5",
        output1: "15",
        input2: "10",
        output2: "55",
      };

    case 6:
      return {
        name: "Count Digits In A Number",
        statement:
          "Read a non-negative integer and print the number of digits.",
        input1: "12345",
        output1: "5",
        input2: "900",
        output2: "3",
      };

    case 7:
      return {
        name: "Calculate Sum Of Digits",
        statement:
          "Read a non-negative integer and print the sum of its digits.",
        input1: "1234",
        output1: "10",
        input2: "908",
        output2: "17",
      };

    case 8:
      return {
        name: "Reverse A Number",
        statement:
          "Read a positive integer and print its digits in reverse order.",
        input1: "1234",
        output1: "4321",
        input2: "567",
        output2: "765",
      };

    default:
      return {
        name: "Find The Smallest Of Three Numbers",
        statement:
          "Read three integers and print the smallest value.",
        input1: "8 3 12",
        output1: "3",
        input2: "20 15 30",
        output2: "15",
      };
  }
}

function createDescription(
  language: string,
  topic: string,
  task: ReturnType<typeof getTask>
): string {
  if (language === "HTML") {
    return `Create an HTML page for task "${task.name}".

Requirements:
- Use semantic HTML elements.
- Include a heading.
- Include a short description.
- Include an input area and output area.
- Keep the structure clean and accessible.

Topic: ${topic}

Note:
HTML problems require browser preview and HTML validation.`;
  }

  if (language === "CSS") {
    return `Create CSS styling for task "${task.name}".

Requirements:
- Use valid CSS.
- Style a container, heading, input and button.
- Add responsive layout rules.
- Avoid inline styles.

Topic: ${topic}

Note:
CSS problems require browser preview and CSS property validation.`;
  }

  if (language === "SQL") {
    return `Write an SQL query for task "${task.name}".

Requirements:
- Use valid SQLite-compatible SQL.
- Return only the requested columns.
- Do not include unnecessary rows.
- Use clear aliases when required.

Topic: ${topic}

Note:
SQL problems require a prepared SQLite database for evaluation.`;
  }

  return `${task.statement}

Input Format:
Input values are provided through standard input.

Output Format:
Print only the required answer.

Constraints:
- Input values are within valid integer limits.
- Do not print additional text.
- Follow the required output format exactly.

Language:
${language}

Topic:
${topic}

Sample Input:
${task.input1}

Sample Output:
${task.output1}`;
}

function buildProblems(): SeedProblem[] {
  const problems: SeedProblem[] = [];

  for (const language of LANGUAGES) {
    for (let index = 0; index < 300; index++) {
      const task = getTask(index);
      const topic = TOPICS[index % TOPICS.length];
      const difficulty = getDifficulty(index);

      const title = `${language} ${task.name} ${
        index + 1
      }`;

      problems.push({
        title,
        slug: slugify(
          `${language}-${task.name}-${index + 1}`
        ),
        description: createDescription(
          language,
          topic,
          task
        ),
        difficulty,
        language,
        topic,
        timeLimit:
          difficulty === Difficulty.HARD ? 3 : 2,
        memoryLimit: 256,
        solvedCount: 0,
        totalCount: 0,
      });
    }
  }

  return problems;
}

async function insertProblems(
  problems: SeedProblem[]
): Promise<void> {
  const chunkSize = 200;

  for (
    let start = 0;
    start < problems.length;
    start += chunkSize
  ) {
    const chunk = problems.slice(
      start,
      start + chunkSize
    );

    await prisma.problem.createMany({
      data: chunk,
      skipDuplicates: true,
    });

    console.log(
      `Problems processed: ${Math.min(
        start + chunkSize,
        problems.length
      )}/${problems.length}`
    );
  }
}

async function insertTestCases(): Promise<void> {
  const executableLanguages = [
    "C",
    "C++",
    "Java",
    "Python",
    "JavaScript",
  ];

  const problems =
    await prisma.problem.findMany({
      where: {
        language: {
          in: executableLanguages,
        },
      },
      select: {
        id: true,
        title: true,
        slug: true,
      },
    });

  await prisma.testCase.deleteMany({
    where: {
      problemId: {
        in: problems.map((problem) => problem.id),
      },
    },
  });

  const testCases: SeedTestCase[] = [];

  for (const problem of problems) {
    const match = problem.slug.match(/-(\d+)$/);
    const index = match
      ? Number(match[1]) - 1
      : 0;

    const task = getTask(index);

    testCases.push({
      problemId: problem.id,
      input: task.input1,
      expectedOutput: task.output1,
      isHidden: false,
      order: 1,
    });

    testCases.push({
      problemId: problem.id,
      input: task.input2,
      expectedOutput: task.output2,
      isHidden: true,
      order: 2,
    });
  }

  const chunkSize = 500;

  for (
    let start = 0;
    start < testCases.length;
    start += chunkSize
  ) {
    const chunk = testCases.slice(
      start,
      start + chunkSize
    );

    await prisma.testCase.createMany({
      data: chunk,
    });

    console.log(
      `Test cases inserted: ${Math.min(
        start + chunkSize,
        testCases.length
      )}/${testCases.length}`
    );
  }
}

async function main() {
  console.log("Starting 2400 problem seed...");

  const problems = buildProblems();

  console.log(
    `Generated ${problems.length} problems.`
  );

  await insertProblems(problems);
  await insertTestCases();

  const totalProblems =
    await prisma.problem.count();

  const grouped =
    await prisma.problem.groupBy({
      by: ["language"],
      _count: {
        id: true,
      },
      orderBy: {
        language: "asc",
      },
    });

  console.log("\nSeed completed successfully.");
  console.log(`Total problems: ${totalProblems}`);

  for (const item of grouped) {
    console.log(
      `${item.language}: ${item._count.id}`
    );
  }
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });