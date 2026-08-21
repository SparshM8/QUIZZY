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
    
    if (!(options.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }
    
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    });

    let data: any;
    const contentType = res.headers.get("Content-Type");
    
    try {
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      } else {
        // Fallback for non-JSON responses (like SPA HTML fallback)
        const text = await res.text();
        if (!res.ok) {
          throw new Error(text || `Request failed with status ${res.status}`);
        }
        data = { success: true, data: text };
      }
    } catch (err) {
      if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}`);
      }
      throw err;
    }

    if (!res.ok) {
      const apiError = data as ApiError;
      throw new Error(apiError.error?.message ?? `Request failed with status ${res.status}`);
    }

    return data as T;
  }

  get<T>(path: string) {
    return this.request<T>(path);
  }

  post<T>(path: string, body?: unknown) {
    const options: RequestInit = { method: "POST" };
    if (body instanceof FormData) {
      options.body = body;
    } else {
      options.body = JSON.stringify(body);
    }
    return this.request<T>(path, options);
  }

  patch<T>(path: string, body?: unknown) {
    return this.request<T>(path, { method: "PATCH", body: JSON.stringify(body) });
  }

  delete<T>(path: string) {
    return this.request<T>(path, { method: "DELETE" });
  }
}

export const api = new ApiClient();
