export type Frequency = "daily" | "weekly" | "monthly";

export interface Habit {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  frequency: Frequency;
  streak: number;
  completedDays: string[]; // ISO dates
  categoryId?: string;
  category: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface ChartDataPoint {
  value: number;
  label: string;
  frontColor?: string;
}
