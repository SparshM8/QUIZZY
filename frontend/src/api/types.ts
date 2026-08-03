export type Role = "admin" | "teacher" | "student" | "recruiter";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface ApiErrorResponse {
  success: false;
  error: { code: string; message: string };
}

export interface QuestionDto {
  id: string;
  title: string;
  statement: string;
  type: string;
  difficulty: string;
  tags: string[];
  points: number;
  options?: { choices: { id: string; text: string }[]; answerIds: string[] };
  fill?: { answers: string[]; caseSensitive?: boolean };
  numerical?: { answer: number; tolerance?: number };
  coding?: { starterCode: string; timeLimitMs: number };
  status: string;
}

export interface TestDto {
  id: string;
  title: string;
  description: string;
  createdBy: { name: string; role: string };
  durationMinutes: number;
  scheduledAt?: string;
  status: string;
  items: { questionId: string; points: number; order: number }[];
  enrolledStudents: { studentId: string; status: string }[];
}

export interface NotificationDto {
  id: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  createdAt: string;
}
