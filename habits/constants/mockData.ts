import { Category, Habit } from "../types";

export const CATEGORIES: Category[] = [
  { id: "1", name: "Health", icon: "heart", color: "#EF4444" },
  { id: "2", name: "Productivity", icon: "briefcase", color: "#3B82F6" },
  { id: "3", name: "Mindfulness", icon: "leaf", color: "#10B981" },
  { id: "4", name: "Coding", icon: "code", color: "#FAD4A5" },
];

export const MOCK_HABITS: Habit[] = [
  {
    id: "1",
    title: "Morning Yoga",
    description: "15 minutes of stretching",
    icon: "body-outline",
    color: "#F25E86",
    frequency: "daily",
    streak: 8,
    completedDays: ["2026-02-07", "2026-02-06"],
    category: "Health",
    categoryId: "1",
  },
  {
    id: "2",
    title: "Read 20 Pages",
    description: "Personal development books",
    icon: "book-outline",
    color: "#3B82F6",
    frequency: "daily",
    streak: 15,
    completedDays: ["2026-02-07", "2026-02-06", "2026-02-05"],
    category: "Productivity",
    categoryId: "2",
  },
  {
    id: "3",
    title: "Meditation",
    description: "Focus on breathing",
    icon: "leaf-outline",
    color: "#10B981",
    frequency: "daily",
    streak: 4,
    completedDays: ["2026-02-07"],
    category: "Mindfulness",
    categoryId: "3",
  },
];

export const STATS_DATA = {
  completionRate: 85,
  totalHabits: 12,
  activeStreaks: 4,
  weeklyProgress: [
    { value: 40, label: "Mon" },
    { value: 65, label: "Tue" },
    { value: 50, label: "Wed" },
    { value: 80, label: "Thu" },
    { value: 95, label: "Fri" },
    { value: 70, label: "Sat" },
    { value: 85, label: "Sun" },
  ],
};
