import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { Habit } from "../types";

interface HabitCardProps {
  habit: Habit;
  onPress?: () => void;
  onToggle?: () => void;
  isCompletedToday?: boolean;
}

const HabitCard: React.FC<HabitCardProps> = ({
  habit,
  onPress,
  onToggle,
  isCompletedToday,
}) => {
  return (
    <View className="mb-4 flex-row items-center justify-between rounded-[24px] bg-card p-4 shadow-sm border border-border">
      <Pressable
        onPress={onPress}
        className="flex-1 flex-row items-center gap-4 pr-4"
      >
        <View
          className="h-14 w-14 items-center justify-center rounded-[18px]"
          style={{ backgroundColor: `${habit.color}10` }}
        >
          <Ionicons name={habit.icon as any} size={26} color={habit.color} />
        </View>
        <View className="flex-1">
          <Text className="text-lg font-outfit font-bold text-foreground">
            {habit.title}
          </Text>
          <Text
            className="text-sm font-inter text-muted-foreground"
            numberOfLines={1}
          >
            {habit.description}
          </Text>
        </View>
      </Pressable>

      <Pressable
        onPress={onToggle}
        style={({ pressed }) => ({
          height: 56,
          width: 56,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 18,
          backgroundColor: isCompletedToday ? habit.color : "#FFFFFF",
          borderWidth: 2,
          borderColor: isCompletedToday ? habit.color : "#E5E7EB",
          opacity: pressed ? 0.7 : 1,
          flexShrink: 0,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isCompletedToday ? 0.15 : 0.05,
          shadowRadius: 4,
          elevation: isCompletedToday ? 3 : 1,
        })}
      >
        {isCompletedToday ? (
          <Ionicons name="checkmark-sharp" size={32} color="#1F2937" />
        ) : (
          <Ionicons name="ellipse-outline" size={24} color="#9CA3AF" />
        )}
      </Pressable>
    </View>
  );
};

export default HabitCard;
