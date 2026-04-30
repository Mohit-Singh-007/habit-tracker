import { format, isSameDay } from "date-fns";
import AddHabitModal from "@/components/AddHabitModal";
import HabitCard from "@/components/HabitCard";
import HorizontalCalendar from "@/components/HorizontalCalendar";
import SafeScreen from "@/components/SafeScreen";
import UserSync from "@/components/UserSync";
import { useHabits, useToggleHabit } from "@/hooks/useHabits";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";

const DashboardScreen = () => {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Only allow completing habits on the current day
  const isToday = isSameDay(selectedDate, new Date());

  // Fetch habits using TanStack Query - no useEffect needed!
  const { data: habits, isLoading, error } = useHabits(selectedDate);
  const toggleHabit = useToggleHabit(selectedDate);

  const formattedDate = selectedDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  // Calculate progress - memoized to avoid recalculation on every render
  const progress = useMemo(() => {
    if (!habits || habits.length === 0) return { completed: 0, total: 0, percentage: 0 };
    
    const completed = habits.filter(h => h.completedToday).length;
    const total = habits.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { completed, total, percentage };
  }, [habits]);

  const handleToggleHabit = (habitId: string) => {
    console.log("[Dashboard] Toggling habit:", habitId);
    
    // Prevent toggling if the habit is still being created (optimistic)
    if (habitId.startsWith("temp-")) {
      console.log("[Dashboard] Ignoring toggle for temp habit");
      return;
    }
    
    // Optimistic update - UI updates instantly!
    toggleHabit.mutate(habitId);
  };

  return (
    <View className="flex-1 bg-background">
      {/* Sync user with backend on mount */}
      <UserSync />
      
      <SafeScreen>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {/* Header */}
          <View className="px-6 pt-2 pb-6">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-3xl font-outfit font-bold text-foreground">
                  {isSameDay(selectedDate, new Date()) ? "Today" : format(selectedDate, "EEEE")}
                </Text>
                <Text className="text-muted-foreground font-inter">
                  {formattedDate}
                </Text>
              </View>
              <Pressable
                onPress={() => setModalVisible(true)}
                className="shadow-lg h-12 w-12 items-center justify-center rounded-2xl bg-primary"
              >
                <Ionicons name="add" size={28} color="white" />
              </Pressable>
            </View>
          </View>

          {/* Calendar Strip */}
          <HorizontalCalendar
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />

          {/* Progress Card */}
          <View className="mx-6 mb-8 overflow-hidden rounded-[32px] bg-card shadow-xl p-6 border border-border">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-sm font-outfit font-bold text-muted-foreground uppercase tracking-widest">
                  Daily Goal
                </Text>
                <Text className="mt-1 text-3xl font-outfit font-black text-foreground">
                  {progress.completed} / {progress.total}
                </Text>
              </View>
              <View className="h-16 w-16 items-center justify-center rounded-full bg-card border-[5px] border-primary/20 shadow-sm">
                <Text className="font-outfit font-bold text-primary text-lg">
                  {progress.percentage}%
                </Text>
              </View>
            </View>
            <View className="mt-6 h-3 w-full overflow-hidden rounded-full bg-secondary">
              <View
                className="bg-primary"
                style={{ width: `${progress.percentage}%`, height: "100%" }}
              />
            </View>
          </View>

          {/* Habits List */}
          <View className="px-6">
            <Text className="mb-4 text-sm font-outfit font-bold text-muted-foreground uppercase tracking-widest">
              Your Habits
            </Text>

            {/* Loading State */}
            {isLoading && (
              <View className="py-12 items-center">
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text className="mt-4 text-muted-foreground font-inter">
                  Loading your habits...
                </Text>
              </View>
            )}

            {/* Error State */}
            {error && (
              <View className="py-12 items-center">
                <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
                <Text className="mt-4 text-foreground font-inter">
                  Failed to load habits
                </Text>
                {/* Reverted error message to original */}
                <Text className="mt-2 text-sm text-muted-foreground font-inter">
                  {error instanceof Error ? error.message : "Unknown error"}
                </Text>
              </View>
            )}

            {/* Empty State */}
            {!isLoading && !error && habits && habits.length === 0 && (
              <View className="py-12 items-center">
                <Ionicons name="leaf-outline" size={48} color="#9CA3AF" />
                <Text className="mt-4 text-foreground font-inter">
                  No habits yet
                </Text>
                <Text className="mt-2 text-sm text-muted-foreground font-inter">
                  Tap the + button to create your first habit
                </Text>
              </View>
            )}

            {/* Habits List */}
            {habits?.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={{
                  id: habit.id,
                  title: habit.name,
                  description: habit.description || "",
                  icon: habit.icon || "circle",
                  color: habit.color || "#3B82F6",
                  frequency: habit.frequencyType as any,
                  streak: habit.streak?.currentStreak || 0,
                  completedDays: [], // We'll use streak instead
                  category: "", // Optional
                  categoryId: "",
                }}
                isCompletedToday={habit.completedToday}
                canToggle={isToday}
                onPress={() => {
                  console.log("[Dashboard] Pressing habit:", habit.id);
                  if (habit.id.startsWith("temp-")) {
                    console.log("[Dashboard] Ignoring press for temp habit");
                    return;
                  }
                  try {
                    router.push(`/habit/${habit.id}` as any);
                  } catch (e) {
                     console.error("[Dashboard] Navigation Failed:", e);
                  }
                }}
                onToggle={() => handleToggleHabit(habit.id)}
              />
            ))}
          </View>
        </ScrollView>
      </SafeScreen>

      <AddHabitModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
};

export default DashboardScreen;
