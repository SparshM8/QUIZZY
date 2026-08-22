import mongoose from "mongoose";
import { Question } from "./models/Question";
import { connectDatabase, disconnectDatabase } from "./config/database";
// import { env } from "./config/env";

const QUESTIONS = [
  // Aptitude
  {
    title: "Time and Work",
    statement: "A can do a piece of work in 10 days and B in 15 days. How many days will they take to complete the work together?",
    type: "aptitude",
    difficulty: "easy",
    tags: ["Aptitude", "Time and Work"],
    points: 10,
    options: {
      choices: [
        { id: "a", text: "5 days" },
        { id: "b", text: "6 days" },
        { id: "c", text: "7 days" },
        { id: "d", text: "8 days" }
      ],
      answerIds: ["b"]
    },
    status: "approved"
  },
  {
    title: "Profit and Loss",
    statement: "A man buys a cycle for Rs. 1400 and sells it at a loss of 15%. What is the selling price of the cycle?",
    type: "aptitude",
    difficulty: "medium",
    tags: ["Aptitude", "Profit and Loss"],
    points: 10,
    options: {
      choices: [
        { id: "a", text: "Rs. 1090" },
        { id: "b", text: "Rs. 1160" },
        { id: "c", text: "Rs. 1190" },
        { id: "d", text: "Rs. 1202" }
      ],
      answerIds: ["c"]
    },
    status: "approved"
  },
  // Reasoning
  {
    title: "Number Series",
    statement: "Look at this series: 2, 1, (1/2), (1/4), ... What number should come next?",
    type: "reasoning",
    difficulty: "easy",
    tags: ["Reasoning", "Series"],
    points: 10,
    options: {
      choices: [
        { id: "a", text: "(1/3)" },
        { id: "b", text: "(1/8)" },
        { id: "c", text: "(2/8)" },
        { id: "d", text: "(1/16)" }
      ],
      answerIds: ["b"]
    },
    status: "approved"
  },
  {
    title: "Logical Deduction",
    statement: "All mangoes are golden-colored. No golden-colored things are cheap. Conclusion: I. All mangoes are cheap. II. Golden-colored mangoes are not cheap.",
    type: "reasoning",
    difficulty: "medium",
    tags: ["Reasoning", "Logic"],
    points: 10,
    options: {
      choices: [
        { id: "a", text: "Only I follows" },
        { id: "b", text: "Only II follows" },
        { id: "c", text: "Either I or II follows" },
        { id: "d", text: "Neither I nor II follows" }
      ],
      answerIds: ["b"]
    },
    status: "approved"
  },
  // Coding
  {
    title: "FizzBuzz",
    statement: "Write a function `solution(n)` that returns 'Fizz' if `n` is divisible by 3, 'Buzz' if `n` is divisible by 5, 'FizzBuzz' if divisible by both, and the number as a string otherwise.",
    type: "coding",
    difficulty: "easy",
    tags: ["Coding", "Basic"],
    points: 20,
    coding: {
      starterCode: "function solution(n) {\n  // Your code here\n}",
      timeLimitMs: 5000,
      memoryLimitKb: 262144,
      testCases: [
        { input: "3", expectedOutput: "Fizz", timeLimitMs: 2000 },
        { input: "5", expectedOutput: "Buzz", timeLimitMs: 2000 },
        { input: "15", expectedOutput: "FizzBuzz", timeLimitMs: 2000 },
        { input: "7", expectedOutput: "7", timeLimitMs: 2000 }
      ]
    },
    status: "approved"
  }
];

async function seed() {
  try {
    await connectDatabase();
    console.log("Connected to database");

    const { User } = await import("./models/User");
    const admin = await User.findOne({ role: "admin" });
    const adminId = admin ? admin._id : new mongoose.Types.ObjectId();

    for (const q of QUESTIONS) {
      const exists = await Question.findOne({ title: q.title });
      if (!exists) {
        await Question.create({ ...q, createdBy: adminId });
        console.log(`Created question: ${q.title}`);
      } else {
        console.log(`Question already exists: ${q.title}`);
      }
    }

    console.log("Seeding completed");
  } catch (err) {
    console.error("Seeding failed", err);
  } finally {
    await disconnectDatabase();
  }
}

seed();
