import AddHabitModal from '@/components/AddHabitModal';
import ChartSection from '@/components/ChartSection';
import SafeScreen from '@/components/SafeScreen';
import { useHabit, useHabitHeatmap, useHabitTrend, useDeleteHabit } from '@/hooks/useHabits';
import { Ionicons } from '@expo/vector-icons';
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, addMonths, subMonths } from 'date-fns';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';

const HabitDetailScreen = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const habitId = typeof id === 'string' ? id : '';
  const { data: habit, isLoading: habitLoading } = useHabit(habitId);
  const { data: heatmap, isLoading: heatmapLoading } = useHabitHeatmap(habitId);
  const { data: trend, isLoading: trendLoading } = useHabitTrend(habitId);
  const deleteHabit = useDeleteHabit();

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentViewDate, setCurrentViewDate] = useState(new Date());

  // Generate days for the selected month for the calendar view
  const calendarDays = React.useMemo(() => {
    const start = startOfMonth(currentViewDate);
    const end = endOfMonth(currentViewDate);
    const daysInMonth = eachDayOfInterval({ start, end });

    return daysInMonth.map((date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      return {
        date,
        dateStr,
        dayNum: format(date, 'd'),
        isCompleted: heatmap ? !!heatmap[dateStr] : false
      };
    });
  }, [heatmap, currentViewDate]);

  const handleDelete = () => {
    Alert.alert(
      "Delete Habit",
      "Are you sure you want to delete this habit? All progress logs will be lost.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: () => {
            deleteHabit.mutate(habitId, {
              onSuccess: () => router.replace('/(tabs)'),
            });
          } 
        }
      ]
    );
  };

  const nextMonth = () => setCurrentViewDate(prev => addMonths(prev, 1));
  const prevMonth = () => setCurrentViewDate(prev => subMonths(prev, 1));

  if (habitLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (!habit) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 px-6">
        <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
        <Text className="mt-4 text-xl font-bold font-outfit text-gray-900">Habit not found</Text>
        <Pressable onPress={() => router.back()} className="mt-6 rounded-2xl bg-primary px-8 py-3">
          <Text className="font-bold text-white font-inter">Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <SafeScreen>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          {/* Custom Header */}
          <View className="flex-row items-center justify-between px-6 py-4">
            <Pressable
              onPress={() => router.back()}
              className="h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm shadow-gray-200"
            >
              <Ionicons name="chevron-back" size={24} color="#1F2937" />
            </Pressable>
            
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setEditModalVisible(true)}
                className="h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm shadow-gray-200"
              >
                <Ionicons name="pencil" size={20} color="#3B82F6" />
              </Pressable>
              <Pressable
                onPress={handleDelete}
                className="h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm shadow-gray-200"
              >
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
              </Pressable>
            </View>
          </View>

          {/* Habit Info Header */}
          <View className="items-center px-6 py-4">
            <View 
              className="mb-6 h-28 w-28 items-center justify-center rounded-[36px] shadow-xl shadow-gray-200"
              style={{ backgroundColor: `${habit.color || '#3B82F6'}10` }}
            >
              <Ionicons name={(habit.icon as any) || 'circle'} size={54} color={habit.color || '#3B82F6'} />
            </View>
            <View className="items-center">
              <Text className="text-4xl font-black font-outfit text-gray-900 text-center">{habit.name}</Text>
              <View className="mt-2 flex-row items-center gap-2 rounded-full bg-white px-4 py-1.5 shadow-sm border border-gray-100">
                <View className="h-2 w-2 rounded-full" style={{ backgroundColor: habit.color || '#3B82F6' }} />
                <Text className="text-xs font-bold font-inter text-gray-500 uppercase tracking-widest">{habit.frequencyType || 'Daily'}</Text>
              </View>
            </View>
            <Text className="mt-6 text-center text-gray-400 font-inter px-4 leading-6">{habit.description || 'No description provided for this habit.'}</Text>
          </View>

          {/* Stats Bar */}
          <View className="mt-10 flex-row justify-between px-6">
            <StatBox label="Streak" value={`${habit.streak?.currentStreak || 0}d`} icon="flame" color="#F25E86" />
            <StatBox label="Success" value={`${Math.round(((habit.streak?.currentStreak || 0) / 30) * 100)}%`} icon="stats-chart" color="#3B82F6" />
            <StatBox label="Record" value={`${habit.streak?.longestStreak || 0}d`} icon="trophy" color="#F59E0B" />
          </View>

          {/* Activity Grid */}
          <View className="mx-6 mt-12 rounded-[40px] bg-white p-8 shadow-sm shadow-gray-100 border border-gray-50">
            <View className="flex-row items-center justify-between mb-8">
              <Pressable onPress={prevMonth} className="p-2">
                <Ionicons name="chevron-back" size={20} color="#9CA3AF" />
              </Pressable>
              
              <Text className="text-lg font-bold font-outfit text-gray-900 text-center uppercase tracking-tight">
                {format(currentViewDate, 'MMMM yyyy')}
              </Text>

              <Pressable onPress={nextMonth} className="p-2" disabled={isSameMonth(currentViewDate, new Date())}>
                <Ionicons name="chevron-forward" size={20} color={isSameMonth(currentViewDate, new Date()) ? "#E5E7EB" : "#9CA3AF"} />
              </Pressable>
            </View>
            
            {heatmapLoading ? (
              <ActivityIndicator color={habit.color || "#3B82F6"} />
            ) : (
              <View className="flex-row flex-wrap justify-between gap-y-3">
                {calendarDays.map((day, i) => (
                  <View 
                    key={i} 
                    className="h-10 w-10 rounded-xl items-center justify-center border border-gray-50"
                    style={{ 
                      backgroundColor: day.isCompleted ? (habit.color || '#3B82F6') : '#F9FAFB',
                      shadowColor: (day.isCompleted && habit.color) ? habit.color : '#000000',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: day.isCompleted ? 0.3 : 0,
                      shadowRadius: 8,
                      elevation: day.isCompleted ? 4 : 0,
                    }}
                  >
                    <Text className={`text-[10px] font-black font-inter ${day.isCompleted ? 'text-white' : 'text-gray-400'}`}>
                      {day.dayNum}
                    </Text>
                  </View>
                ))}
              </View>
            )}
            
            <View className="mt-8 flex-row items-center justify-center gap-6 border-t border-gray-50 pt-6">
               <View className="flex-row items-center gap-2">
                 <View className="h-3 w-3 rounded-md bg-gray-100" />
                 <Text className="text-[10px] font-bold text-gray-400 font-inter uppercase tracking-widest">Incomplete</Text>
               </View>
               <View className="flex-row items-center gap-2">
                 <View className="h-3 w-3 rounded-md" style={{ backgroundColor: habit.color || '#3B82F6' }} />
                 <Text className="text-[10px] font-bold text-gray-400 font-inter uppercase tracking-widest">Completed</Text>
               </View>
            </View>
          </View>

          {/* History / Performance Chart */}
          <View className="mt-8 px-6">
            <ChartSection 
              title="Execution Trend" 
              data={trend || [
                { value: 0, label: 'W1' },
                { value: 0, label: 'W2' },
                { value: 0, label: 'W3' },
                { value: 0, label: 'W4' },
              ]} 
              type="line"
            />
          </View>
        </ScrollView>
      </SafeScreen>

      <AddHabitModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        initialData={habit}
      />
    </View>
  );
};

const StatBox = ({ label, value, icon, color }: { label: string, value: string, icon: any, color: string }) => (
  <View className="items-center bg-white px-6 py-5 rounded-[28px] shadow-sm border border-gray-50 flex-1 mx-1.5">
    <View className="mb-3 h-11 w-11 items-center justify-center rounded-2xl" style={{ backgroundColor: `${color}10` }}>
      <Ionicons name={icon} size={22} color={color} />
    </View>
    <Text className="text-lg font-black font-outfit text-gray-900">{value}</Text>
    <Text className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mt-0.5">{label}</Text>
  </View>
);

export default HabitDetailScreen;
