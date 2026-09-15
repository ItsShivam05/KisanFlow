/**
 * Centralized API client for KisanFlow Frontend.
 * Supports Node backend (/api/v1) and AI & Optimization Service (FastAPI).
 */

export const apiUrl =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

export const aiServiceUrl =
  process.env.NEXT_PUBLIC_AI_SERVICE_URL ||
  (typeof window !== "undefined" ? "/ai-service" : "http://127.0.0.1:8000");

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("kisanflow_token") : null;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const endpoint = path.startsWith("http") ? path : `${apiUrl}${path.startsWith("/") ? "" : "/"}${path}`;
  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = `Request failed with status ${response.status}`;
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errJson.message || errorDetail;
    } catch {
      // ignore json parse errors
    }
    throw new Error(errorDetail);
  }

  const data = await response.json();
  return (data.data !== undefined ? data.data : data) as T;
}

export async function aiApiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const endpoint = path.startsWith("http") ? path : `${aiServiceUrl}${cleanPath}`;

  try {
    const response = await fetch(endpoint, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorDetail = `AI Service returned status ${response.status}`;
      try {
        const errJson = await response.json();
        errorDetail = errJson.detail || errJson.message || errorDetail;
      } catch {
        // ignore
      }
      throw new Error(errorDetail);
    }

    return (await response.json()) as T;
  } catch (err: any) {
    if (err.message === "Failed to fetch" || err.name === "TypeError") {
      throw new Error(
        "KisanFlow AI Service is offline or unreachable on port 8000. Start it via: uvicorn ai_service.app.main:app --port 8000"
      );
    }
    throw err;
  }
}

