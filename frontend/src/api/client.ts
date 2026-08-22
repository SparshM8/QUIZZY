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
      
      // Safety check: if data is a string (e.g. HTML fallback) but we expect JSON
      if (typeof data === 'string' && data.trim().startsWith('<!DOCTYPE html>')) {
        throw new Error("Received HTML instead of JSON. The server might be misconfigured or the route is incorrect.");
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

  get<T>(path: string, options: RequestInit = {}) {
    return this.request<T>(path, options);
  }

  async download(path: string, filename: string) {
    const token = localStorage.getItem("quizzy.accessToken");
    const headers = new Headers();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    const res = await fetch(`${this.baseUrl}${path}`, { headers });
    if (!res.ok) throw new Error("Download failed");
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
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
