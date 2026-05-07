import {
  CreateHabitRequest,
  HabitFromAPI,
  HeatmapData,
  SyncUserRequest,
  ToggleHabitResponse,
  User,
} from "@/types/api";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000/api";

class APIError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "APIError";
  }
}

async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new APIError(
        response.status,
        error.error || `HTTP ${response.status}`
      );
    }

    return response.json();
  } catch (error) {
    if (error instanceof APIError) throw error;
    throw new Error(`Network error: ${error instanceof Error ? error.message : "Unknown"}`);
  }
}


export const userAPI = {
  sync: (data: SyncUserRequest) =>
    fetchAPI<User>("/users/sync", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};


export const habitAPI = {
  getAll: (clerkId: string, date?: string) =>
    fetchAPI<HabitFromAPI[]>(`/habits?clerkId=${encodeURIComponent(clerkId)}${date ? `&date=${date}` : ""}`),

  create: (data: CreateHabitRequest) =>
    fetchAPI<HabitFromAPI>("/habits", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  toggle: (habitId: string, date?: string) =>
    fetchAPI<ToggleHabitResponse>(`/habits/${habitId}/toggle`, {
      method: "POST",
      body: JSON.stringify({ date }),
    }),

  update: (habitId: string, data: Partial<CreateHabitRequest>) =>
    fetchAPI<HabitFromAPI>(`/habits/${habitId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (habitId: string) =>
    fetchAPI<{ message: string }>(`/habits/${habitId}`, {
      method: "DELETE",
    }),

  getHeatmap: (habitId: string) =>
    fetchAPI<HeatmapData>(`/habits/${habitId}/heatmap`),

  getWeeklyStats: (clerkId: string) =>
    fetchAPI<{ label: string; value: number }[]>(`/habits/stats/weekly?clerkId=${encodeURIComponent(clerkId)}`),

  getDetailedStats: (clerkId: string) =>
    fetchAPI<any>(`/habits/stats/detailed?clerkId=${encodeURIComponent(clerkId)}`),

  getTrend: (habitId: string) =>
    fetchAPI<{ label: string; value: number }[]>(`/habits/${habitId}/trend`),
};
