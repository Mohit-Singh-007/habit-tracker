export interface Habit {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  frequency: "daily" | "weekly";
  streak: number;
  completedDays: string[];
  category?: string;
  categoryId?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}
