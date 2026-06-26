import { PrismaClient, Difficulty } from "@prisma/client";

const prisma = new PrismaClient();

type SeedProblem = {
  language: string;
  topic: string;
  difficulty: Difficulty;
  title: string;
  description: string;
};

const topics: Record<string, string[]> = {
  C: [
    "Basics",
    "Input Output",
    "Operators",
    "Conditions",
    "Loops",
    "Arrays",
    "Strings",
    "Functions",
    "Pointers",
    "Structures",
  ],
  "C++": [
    "Basics",
    "OOP",
    "Arrays",
    "Strings",
    "Functions",
    "Pointers",
    "STL Vector",
    "STL Map",
    "Recursion",
    "Sorting",
  ],
  Java: [
    "Basics",
    "OOP",
    "Arrays",
    "Strings",
    "Methods",
    "Inheritance",
    "Polymorphism",
    "Exception Handling",
    "Collections",
    "File Handling",
  ],
  Python: [
    "Basics",
    "Variables",
    "Conditions",
    "Loops",
    "Lists",
    "Tuples",
    "Dictionaries",
    "Strings",
    "Functions",
    "OOP",
  ],
  HTML: [
    "Basics",
    "Headings",
    "Links Images",
    "Lists",
    "Tables",
    "Forms",
    "Input Elements",
    "Semantic Tags",
    "Audio Video",
    "CSS Basics",
  ],
};

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/\+\+/g, "pp")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function makeProblems(language: string, topic: string): SeedProblem[] {
  return [
    {
      language,
      topic,
      difficulty: "EASY",
      title: `${topic}: Easy Practice`,
      description: `Solve a basic ${topic} problem using ${language}.`,
    },
    {
      language,
      topic,
      difficulty: "MEDIUM",
      title: `${topic}: Medium Challenge`,
      description: `Solve a medium-level ${topic} problem using ${language}.`,
    },
    {
      language,
      topic,
      difficulty: "HARD",
      title: `${topic}: Hard Challenge`,
      description: `Solve an advanced ${topic} problem using ${language}.`,
    },
  ];
}

async function main() {
  await prisma.problem.deleteMany({
    where: {
      slug: {
        contains: "-problem-",
      },
    },
  });

  const allProblems: SeedProblem[] = [];

  for (const [language, topicList] of Object.entries(topics)) {
    for (const topic of topicList) {
      allProblems.push(...makeProblems(language, topic));
    }
  }

  for (const problem of allProblems) {
    const slug = slugify(
      `${problem.language}-${problem.topic}-${problem.difficulty}`
    );

    await prisma.problem.upsert({
      where: { slug },
      update: {
        title: problem.title,
        description: problem.description,
        difficulty: problem.difficulty,
        language: problem.language,
        topic: problem.topic,
      },
      create: {
        title: problem.title,
        slug,
        description: problem.description,
        difficulty: problem.difficulty,
        language: problem.language,
        topic: problem.topic,
        timeLimit: 2,
        memoryLimit: 256,
      },
    });
  }

  console.log(`${allProblems.length} topic-wise problems seeded successfully`);
}

main()
  .catch((error) => {
    console.error(error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });