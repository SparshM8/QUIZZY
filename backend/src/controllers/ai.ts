import type { Request, Response, NextFunction } from "express";
import { AppError } from "../middleware/errorHandler";
import { OpenAI } from "openai";

// Initialize OpenAI client lazily to avoid crashing in environments without API keys (e.g., CI)
let openai: OpenAI | null = null;

const getOpenAI = () => {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY || "dummy_key_for_ci";
    openai = new OpenAI({ apiKey });
  }
  return openai;
};

export const handleInterviewChat = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      throw new AppError(400, "VALIDATION_ERROR", "Messages are required");
    }

    const client = getOpenAI();

    const systemPrompt = {
      role: "system",
      content: "You are a professional technical interviewer for a top-tier tech company. Your goal is to conduct a realistic mock interview. Be professional, ask challenging follow-up questions, and provide constructive feedback when appropriate. Start by asking for the candidate's target role, then ask a mix of behavioral and technical questions."
    };

    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [systemPrompt, ...messages],
      max_tokens: 500,
    });

    const reply = completion.choices[0].message.content;
    res.json({ content: reply });
  } catch (err) {
    next(err);
  }
};
