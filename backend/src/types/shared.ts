export type Role = "admin" | "teacher" | "student";

export const ROLES: Role[] = ["admin", "teacher", "student"];

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: { code: string; message: string };
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  pages: number;
}
