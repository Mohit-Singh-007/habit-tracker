import { habitAPI, userAPI } from "@/lib/api-client";
import { CreateHabitRequest, HabitFromAPI, SyncUserRequest } from "@/types/api";
import { useAuth } from "@clerk/clerk-expo";
import {
  useMutation,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from "@tanstack/react-query";
import { format } from "date-fns";

// Query Keys - centralized for consistency
export const queryKeys = {
  user: (clerkId: string) => ["user", clerkId] as const,
  habits: (clerkId: string, date?: string) => {
    const key = ["habits", clerkId];
    if (date) key.push(date);
    return key;
  },
  heatmap: (habitId: string) => ["heatmap", habitId] as const,
  weeklyStats: (clerkId: string) => ["weeklyStats", clerkId] as const,
  detailedStats: (clerkId: string) => ["detailedStats", clerkId] as const,
  trend: (habitId: string) => ["trend", habitId] as const,
};



/**
 * Syncs the Clerk user with the backend database
 * Call this once after successful login
 */
export function useSyncUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SyncUserRequest) => userAPI.sync(data),
    onSuccess: (user) => {
      // Cache the user data
      queryClient.setQueryData(queryKeys.user(user.clerkId), user);
    },
  });
}



/**
 * Fetches all habits for the current user
 */
export function useHabits(date?: Date, options?: Omit<UseQueryOptions<HabitFromAPI[]>, "queryKey" | "queryFn">) {
  const { userId } = useAuth();
  const dateStr = date ? format(date, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd");

  return useQuery({
    queryKey: queryKeys.habits(userId || "", dateStr),
    queryFn: () => habitAPI.getAll(userId!, dateStr),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
    ...options,
  });
}

/**
 * Fetches a single habit by ID
 */
export function useHabit(habitId: string) {
  const { userId } = useAuth();
  
  return useQuery({
    queryKey: queryKeys.habits(userId || ""), // Use base key for fetching all (today)
    queryFn: () => habitAPI.getAll(userId!),
    enabled: !!userId && !!habitId,
    select: (habits) => habits.find((h) => h.id === habitId),
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Creates a new habit
 * Optimistically updates the UI before the server responds
 */
export function useCreateHabit() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    mutationFn: (data: Omit<CreateHabitRequest, "clerkId">) =>
      habitAPI.create({ ...data, clerkId: userId! }),
    
   
    onMutate: async (newHabit) => {
      if (!userId) return;

     
      await queryClient.cancelQueries({ queryKey: queryKeys.habits(userId) });

     
      const previousHabits = queryClient.getQueryData<HabitFromAPI[]>(
        queryKeys.habits(userId)
      );

      
      const optimisticHabit: HabitFromAPI = {
        id: `temp-${Date.now()}`,
        name: newHabit.name,
        description: newHabit.description || null,
        icon: newHabit.icon || "circle",
        color: newHabit.color || "#3B82F6",
        frequencyType: newHabit.frequencyType || "daily",
        frequencyValue: newHabit.frequencyValue || null,
        userId: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        streak: {
          id: `temp-streak-${Date.now()}`,
          currentStreak: 0,
          longestStreak: 0,
          habitId: `temp-${Date.now()}`,
        },
        completedToday: false,
      };

      queryClient.setQueryData<HabitFromAPI[]>(
        queryKeys.habits(userId),
        (old) => [...(old || []), optimisticHabit]
      );

      return { previousHabits };
    },

    onError: (_err, _newHabit, context) => {
    
      if (userId && context?.previousHabits) {
        queryClient.setQueryData(queryKeys.habits(userId), context.previousHabits);
      }
    },

    onSettled: () => {
      if (userId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.habits(userId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.weeklyStats(userId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.detailedStats(userId) });
      }
    },
  });
}

/**
 * Toggles habit completion for today
 * Uses optimistic updates for instant UI feedback
 */
export function useToggleHabit(date?: Date) {
  const queryClient = useQueryClient();
  const { userId } = useAuth();
  const dateStr = date ? format(date, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd");

  return useMutation({
    mutationFn: (habitId: string) => habitAPI.toggle(habitId, dateStr),
    
    onMutate: async (habitId) => {
      if (!userId) return;

      await queryClient.cancelQueries({ queryKey: queryKeys.habits(userId, dateStr) });

      const previousHabits = queryClient.getQueryData<HabitFromAPI[]>(
        queryKeys.habits(userId, dateStr)
      );

    
      queryClient.setQueryData<HabitFromAPI[]>(
        queryKeys.habits(userId, dateStr),
        (old) =>
          old?.map((habit) => {
            if (habit.id === habitId) {
              const isCompleted = !habit.completedToday;
              return {
                ...habit,
                completedToday: isCompleted,
                streak: habit.streak ? {
                  ...habit.streak,
                  currentStreak: isCompleted 
                    ? habit.streak.currentStreak + 1 
                    : Math.max(0, habit.streak.currentStreak - 1)
                } : null,
              };
            }
            return habit;
          }) || []
      );

      return { previousHabits };
    },

    onError: (err, _habitId, context) => {
      console.error("[useToggleHabit] Error:", err);
      if (userId && context?.previousHabits) {
        queryClient.setQueryData(queryKeys.habits(userId, dateStr), context.previousHabits);
      }
    },

    onSettled: async () => {
      
      await new Promise(resolve => setTimeout(resolve, 100));

      if (userId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.habits(userId, dateStr) });
        queryClient.invalidateQueries({ queryKey: queryKeys.weeklyStats(userId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.detailedStats(userId) });
      }
    },
  });
}

/**
 * Updates an existing habit
 */
export function useUpdateHabit() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    mutationFn: ({ habitId, data }: { habitId: string; data: Partial<CreateHabitRequest> }) =>
      habitAPI.update(habitId, data),

    onMutate: async ({ habitId, data }) => {
      if (!userId) return;

      await queryClient.cancelQueries({ queryKey: queryKeys.habits(userId) });

      const previousQueries = queryClient.getQueriesData<HabitFromAPI[]>({
        queryKey: ["habits", userId],
      });

      queryClient.setQueriesData<HabitFromAPI[]>(
        { queryKey: ["habits", userId] },
        (old) =>
          old?.map((habit) =>
            habit.id === habitId
              ? {
                  ...habit,
                  ...(data.name !== undefined && { name: data.name }),
                  ...(data.description !== undefined && { description: data.description ?? null }),
                  ...(data.icon !== undefined && { icon: data.icon ?? "circle" }),
                  ...(data.color !== undefined && { color: data.color ?? "#3B82F6" }),
                  ...(data.frequencyType !== undefined && { frequencyType: data.frequencyType }),
                  updatedAt: new Date().toISOString(),
                }
              : habit
          ) || []
      );

      return { previousQueries };
    },

    onError: (_err, _vars, context) => {
      if (context?.previousQueries) {
        for (const [queryKey, data] of context.previousQueries) {
          queryClient.setQueryData(queryKey, data);
        }
      }
    },

    onSettled: () => {
      if (userId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.habits(userId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.weeklyStats(userId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.detailedStats(userId) });
      }
    },
  });
}

/**
 * Delete a habit
 */
export function useDeleteHabit() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  return useMutation({
    mutationFn: (habitId: string) => habitAPI.delete(habitId),

    onMutate: async (habitId) => {
      if (!userId) return;

      await queryClient.cancelQueries({ queryKey: queryKeys.habits(userId) });


      const previousQueries = queryClient.getQueriesData<HabitFromAPI[]>({
        queryKey: ["habits", userId],
      });

      
      queryClient.setQueriesData<HabitFromAPI[]>(
        { queryKey: ["habits", userId] },
        (old) => old?.filter((habit) => habit.id !== habitId) || []
      );

      return { previousQueries };
    },

    onError: (_err, _habitId, context) => {
      if (context?.previousQueries) {
        for (const [queryKey, data] of context.previousQueries) {
          queryClient.setQueryData(queryKey, data);
        }
      }
    },

    onSettled: () => {
      if (userId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.habits(userId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.weeklyStats(userId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.detailedStats(userId) });
      }
    },
  });
}

/**
 * Fetches heatmap data for a specific habit
 * Used for GitHub-style contribution graphs
 */
export function useHabitHeatmap(habitId: string | null) {
  return useQuery({
    queryKey: queryKeys.heatmap(habitId || ""),
    queryFn: () => habitAPI.getHeatmap(habitId!),
    enabled: !!habitId,
    staleTime: 1000 * 60 * 10, 
  });
}

/**
 * Fetches aggregate weekly stats for all habits
 */
export function useWeeklyStats() {
  const { userId } = useAuth();
  
  return useQuery({
    queryKey: queryKeys.weeklyStats(userId || ""),
    queryFn: () => habitAPI.getWeeklyStats(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Fetches detailed aggregate stats for all habits
 */
export function useDetailedStats() {
  const { userId } = useAuth();
  
  return useQuery({
    queryKey: queryKeys.detailedStats(userId || ""),
    queryFn: () => habitAPI.getDetailedStats(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Fetches weekly execution trend for a specific habit
 */
export function useHabitTrend(habitId: string | null) {
  return useQuery({
    queryKey: queryKeys.trend(habitId || ""),
    queryFn: () => habitAPI.getTrend(habitId!),
    enabled: !!habitId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Helper to check if a habit is completed today
 * No API call - uses cached data
 */
export function useIsHabitCompletedToday(habitId: string) {
  const { userId } = useAuth();
  const { data: habits } = useHabits(undefined, { enabled: false }); // Don't trigger fetch
  
  const habit = habits?.find((h) => h.id === habitId);
  return habit?.completedToday || false;
}
