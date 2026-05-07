import { format, startOfDay, subDays } from "date-fns";
import prisma from "../lib/prisma";
import redis from "../lib/redis";

export async function updateStreaks(habitId: string, referenceDate?: Date) {
  const logs = await prisma.habitLog.findMany({
    where: { habitId },
    orderBy: { date: "desc" },
  });

  if (logs.length === 0) {
    await prisma.streak.upsert({
      where: { habitId },
      create: { habitId, currentStreak: 0, longestStreak: 0 },
      update: { currentStreak: 0 },
    });
    return;
  }

  let currentStreak = 0;
  let longestStreak = 0;

  const completionDates = new Set(
    logs.map((l) => format(l.date, "yyyy-MM-dd")),
  );

  // Use today as reference for "current" streak
  let checkDate = startOfDay(new Date());

  // Calculate current streak
  while (completionDates.has(format(checkDate, "yyyy-MM-dd"))) {
    currentStreak++;
    checkDate = subDays(checkDate, 1);
  }

  if (currentStreak === 0) {
    checkDate = subDays(startOfDay(new Date()), 1);
    while (completionDates.has(format(checkDate, "yyyy-MM-dd"))) {
      currentStreak++;
      checkDate = subDays(checkDate, 1);
    }
  }

  const sortedDates = Array.from(completionDates).sort();
  let maxConsecutive = 0;
  let currentConsecutive = 0;
  let lastDate: Date | null = null;

  for (const dStr of sortedDates) {
    const d = new Date(dStr);
    if (!lastDate) {
      currentConsecutive = 1;
    } else {
      const diffDays = Math.round(
        (d.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (diffDays === 1) {
        currentConsecutive++;
      } else {
        currentConsecutive = 1;
      }
    }
    maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
    lastDate = d;
  }

  longestStreak = maxConsecutive;

  await prisma.streak.upsert({
    where: { habitId },
    create: { habitId, currentStreak, longestStreak },
    update: { currentStreak, longestStreak },
  });

  try {
    await redis.set(
      `streak:${habitId}`,
      JSON.stringify({ currentStreak, longestStreak }),
      "EX",
      3600,
    );
  } catch (err) {
    console.warn("Failed to cache streak in Redis");
  }
}
