// API Request/Response Types
export interface User {
  id: string;
  clerkId: string;
  email: string | null;
  name: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Streak {
  id: string;
  currentStreak: number;
  longestStreak: number;
  habitId: string;
}

export interface HabitFromAPI {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  frequencyType: string;
  frequencyValue: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
  streak: Streak | null;
  completedToday: boolean;
}

export interface CreateHabitRequest {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  frequencyType?: string;
  frequencyValue?: string;
  clerkId: string;
}

export interface SyncUserRequest {
  clerkId: string;
  email?: string;
  name?: string;
}

export interface ToggleHabitResponse {
  message: string;
  status: boolean;
}

export interface HeatmapData {
  [date: string]: number; // date in 'yyyy-MM-dd' format
}
