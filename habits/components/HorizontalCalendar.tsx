import { addDays, format, isSameDay, startOfDay, subDays } from "date-fns";
import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

interface HorizontalCalendarProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

const HorizontalCalendar: React.FC<HorizontalCalendarProps> = ({
  selectedDate,
  onSelectDate,
}) => {
  const [dates, setDates] = useState<Date[]>([]);

  useEffect(() => {
    const today = startOfDay(new Date());
    const startDate = subDays(today, 7);
    const days = [];

    // Generate previous 7 days and next 14 days (total 22 days including today)
    for (let i = 0; i < 22; i++) {
      days.push(addDays(startDate, i));
    }
    setDates(days);
  }, []);

  return (
    <View className="mb-6">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}
      >
        {dates.map((date, index) => {
          const isSelected = isSameDay(date, selectedDate);

          // formatting using date-fns
          const dayName = format(date, "EEE");
          const dayNumber = format(date, "d");

          return (
            <Pressable
              key={index}
              onPress={() => onSelectDate(date)}
              style={{
                shadowColor: isSelected ? "rgb(var(--primary))" : "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: isSelected ? 0.3 : 0.05,
                shadowRadius: 8,
                elevation: isSelected ? 8 : 2,
              }}
            >
              {isSelected ? (
                <View className="h-[76px] w-[60px] items-center justify-center rounded-[20px] bg-primary">
                  <Text className="text-xs font-outfit font-semibold text-primary-foreground uppercase tracking-wide">
                    {dayName}
                  </Text>
                  <Text className="mt-1 text-2xl font-outfit font-bold text-primary-foreground">
                    {dayNumber}
                  </Text>
                </View>
              ) : (
                <View className="h-[76px] w-[60px] items-center justify-center rounded-[20px] bg-card border border-border">
                  <Text className="text-xs font-inter text-muted-foreground uppercase tracking-wide">
                    {dayName}
                  </Text>
                  <Text className="mt-1 text-xl font-outfit font-bold text-foreground">
                    {dayNumber}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default HorizontalCalendar;
