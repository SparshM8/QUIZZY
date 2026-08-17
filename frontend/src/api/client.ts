export interface ApiError {
  success: false;
  error: { code: string; message: string };
}

export const apiBaseUrl = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

class ApiClient {
  private baseUrl = apiBaseUrl;

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = localStorage.getItem("quizzy.accessToken");
    const headers = new Headers(options.headers);
    headers.set("Content-Type", "application/json");
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    });

    const data = (await res.json()) as { success?: boolean } | ApiError;

    if (!res.ok) {
      const apiError = data as ApiError;
      throw new Error(apiError.error?.message ?? "Request failed");
    }

    return data as T;
  }

  get<T>(path: string) {
    return this.request<T>(path);
  }

  post<T>(path: string, body?: unknown) {
    return this.request<T>(path, { method: "POST", body: JSON.stringify(body) });
  }

  patch<T>(path: string, body?: unknown) {
    return this.request<T>(path, { method: "PATCH", body: JSON.stringify(body) });
  }

  delete<T>(path: string) {
    return this.request<T>(path, { method: "DELETE" });
  }
}

export const api = new ApiClient();
