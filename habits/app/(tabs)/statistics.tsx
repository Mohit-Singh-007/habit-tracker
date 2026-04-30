import ChartSection from "@/components/ChartSection";
import SafeScreen from "@/components/SafeScreen";
import { useDetailedStats, useHabits, useWeeklyStats } from "@/hooks/useHabits";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";

const StatisticsScreen = () => {
  const { user } = useUser();
  const { data: habits, isLoading: habitsLoading } = useHabits(undefined);
  const { data: weeklyStats, isLoading: statsLoading } = useWeeklyStats();
  const { data: detailedStats, isLoading: detailedLoading } = useDetailedStats();

  const stats = useMemo(() => {
    if (!habits || habits.length === 0) {
      return {
        completionRate: 0,
        bestStreak: 0,
        totalHabits: 0,
      };
    }

    const totalHabits = habits.length;
    const completedToday = habits.filter(h => h.completedToday).length;
    const completionRate = Math.round((completedToday / totalHabits) * 100);
    
    // Find best streak across all habits
    const bestStreak = Math.max(...habits.map(h => h.streak?.longestStreak || 0));

    return { completionRate, bestStreak, totalHabits };
  }, [habits]);

  const insights = useMemo(() => {
    if (!habits || habits.length === 0) return [];
    
    const insightsList = [
      {
        icon: "flame",
        color: "#EF4444",
        text: `Your current top streak is ${stats.bestStreak} days! Keep it up!`,
      },
    ];

    if (stats.completionRate > 70) {
      insightsList.push({
        icon: "trending-up",
        color: "#10B981",
        text: "You're smashing it today! High completion rate.",
      });
    }

    return insightsList;
  }, [habits, stats]);

  if (habitsLoading || statsLoading || detailedLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <SafeScreen>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          <View className="px-6 py-8">
            <Text className="text-3xl font-bold font-outfit text-gray-900">Statistics</Text>
            <Text className="mt-1 text-gray-500 font-inter">Your habits journey</Text>
          </View>

          <View className="px-6">
            {/* Quick Stats Grid */}
            <View className="mb-8 flex-row gap-4">
              <View className="flex-1 rounded-[32px] p-6 shadow-xl shadow-blue-500/20 bg-primary">
                <View className="h-10 w-10 items-center justify-center rounded-2xl bg-white/20">
                  <Ionicons name="stats-chart" size={20} color="white" />
                </View>
                <Text className="mt-4 text-sm font-medium text-white/70 font-inter">
                  Success Rate
                </Text>
                <Text className="mt-1 text-4xl font-black text-white font-outfit">
                  {stats.completionRate}%
                </Text>
              </View>
              <View className="flex-1 rounded-[32px] bg-white p-6 shadow-sm shadow-gray-200 border border-gray-100">
                <View className="h-10 w-10 items-center justify-center rounded-2xl bg-orange-50">
                  <Ionicons name="trophy" size={20} color="#F59E0B" />
                </View>
                <Text className="mt-4 text-sm font-medium text-gray-400 font-inter uppercase tracking-wide">
                  Best Streak
                </Text>
                <Text className="mt-1 text-3xl font-bold text-gray-900 font-outfit">
                  {stats.bestStreak}{" "}
                  <Text className="text-lg font-medium text-gray-400 font-inter">
                    Days
                  </Text>
                </Text>
              </View>
            </View>

            {/* Weekly Activity Chart */}
            <ChartSection
              title="Weekly Progress"
              data={weeklyStats || []}
              type="bar"
            />

            {/* Habit Breakdown (Pie) */}
            {detailedStats?.habitBreakdown?.length > 0 && (
              <ChartSection
                title="Activity Breakdown"
                data={detailedStats.habitBreakdown.map((h: any) => ({
                    value: h.value,
                    color: h.color,
                    label: h.name
                }))}
                type="pie"
              />
            )}

            {/* Best Performing Habits */}
            {detailedStats?.bestHabits?.length > 0 && (
                <View className="mb-8 rounded-[32px] bg-white p-7 shadow-sm shadow-gray-200 border border-gray-100">
                    <Text className="text-xl font-bold text-gray-900 font-outfit mb-5">
                       Best Performing Habits
                    </Text>
                    <View className="gap-4">
                        {detailedStats.bestHabits.map((habit: any, idx: number) => (
                            <View key={habit.id} className="flex-row items-center justify-between">
                                <View className="flex-row items-center gap-3">
                                    <View className="h-2 w-2 rounded-full" style={{ backgroundColor: habit.color }} />
                                    <Text className="font-semibold text-gray-800 font-inter">{habit.name}</Text>
                                </View>
                                <View className="flex-row items-center gap-1">
                                    <Ionicons name="flame" size={14} color="#F25E86" />
                                    <Text className="text-sm font-bold text-gray-500">{habit.streak}d</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>
            )}

            {/* All Time Achievements */}
            <View className="mb-8 flex-row gap-4">
                <View className="flex-1 rounded-[32px] bg-white p-6 shadow-sm border border-gray-100">
                    <View className="h-10 w-10 items-center justify-center rounded-2xl bg-green-50 mb-4">
                        <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                    </View>
                    <Text className="text-xs font-bold text-gray-400 tracking-widest uppercase font-inter">Total Logs</Text>
                    <Text className="mt-1 text-3xl font-black text-gray-900 font-outfit">{detailedStats?.allTimeStats?.totalLogs || 0}</Text>
                </View>
                <View className="flex-1 rounded-[32px] bg-white p-6 shadow-sm border border-gray-100">
                    <View className="h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 mb-4">
                        <Ionicons name="list" size={20} color="#3B82F6" />
                    </View>
                    <Text className="text-xs font-bold text-gray-400 tracking-widest uppercase font-inter">Total Habits</Text>
                    <Text className="mt-1 text-3xl font-black text-gray-900 font-outfit">{detailedStats?.allTimeStats?.totalHabits || 0}</Text>
                </View>
            </View>

            {/* Completion Trend Chart - Real Monthly Trend */}
            <ChartSection
              title="Execution Trend"
              data={detailedStats?.monthlyTrend || [
                { value: 0, label: 'W1' },
                { value: 0, label: 'W2' },
                { value: 0, label: 'W3' },
                { value: 0, label: 'W4' },
              ]}
              type="line"
            />

            {/* Insights Section */}
            <View className="mb-8 rounded-[32px] bg-white p-7 shadow-sm shadow-gray-200 border border-gray-100">
              <View className="flex-row items-center justify-between mb-5">
                <Text className="text-xl font-bold text-gray-900 font-outfit">
                  Insights
                </Text>
                <View className="h-8 w-8 items-center justify-center rounded-full bg-blue-50">
                  <Ionicons name="bulb" size={18} color="#3B82F6" />
                </View>
              </View>
              
              <View className="gap-5">
                {insights.length > 0 ? insights.map((insight, idx) => (
                  <InsightItem
                    key={idx}
                    icon={insight.icon}
                    color={insight.color}
                    text={insight.text}
                  />
                )) : (
                  <Text className="text-gray-400 font-inter text-center py-4">
                    Complete more habits to see insights!
                  </Text>
                )}
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeScreen>
    </View>
  );
};

const InsightItem = ({
  icon,
  color,
  text,
}: {
  icon: any;
  color: string;
  text: string;
}) => (
  <View className="flex-row items-center gap-3">
    <View
      className="h-8 w-8 items-center justify-center rounded-full"
      style={{ backgroundColor: `${color}15` }}
    >
      <Ionicons name={icon} size={18} color={color} />
    </View>
    <Text className="flex-1 text-gray-700 font-inter">{text}</Text>
  </View>
);

export default StatisticsScreen;
