import { Request, Response } from "express";
import prisma from "../lib/prisma";
import redis from "../lib/redis";
import { startOfDay, endOfDay, subDays, addDays, format } from "date-fns";


const invalidateHabitCaches = async (
  clerkId: string,
  habitId: string,
  date?: string,
) => {
  try {
    const today = startOfDay(new Date());
    const targetDateStr = date || format(today, "yyyy-MM-dd");

    // 1. Basic user-wide and habit-specific keys
    const keysToDel = [
      `stats:weekly:${clerkId}`,
      `stats:detailed:${clerkId}`,
      `habit:trend:${habitId}`,
      `habit:heatmap:${habitId}`,
      `streak:${habitId}`,
    ];

    if (date) {
      // If a specific date is provided (e.g. toggle on a specific day),
      // only invalidate that day's list.
      keysToDel.push(`habits:${clerkId}:${date}`);
    } else {
      // If no date provided, it's a structural change (create/update/delete).
      // We must clear the entire visible range in the UI (past 7, future 14 days)
      // to ensure the change reflects everywhere instantly.
      for (let i = -7; i <= 14; i++) {
        const dStr = format(addDays(today, i), "yyyy-MM-dd");
        keysToDel.push(`habits:${clerkId}:${dStr}`);
      }
    }

    await Promise.all(keysToDel.map((key) => redis.del(key)));
    console.log(
      `[Cache] Invalidated ${keysToDel.length} keys for user ${clerkId} (Habit: ${habitId})`,
    );
  } catch (err) {
    console.warn(
      `[Cache] Failed to invalidate caches for habit ${habitId}:`,
      err,
    );
  }
};

export const createHabit = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const {
    name,
    description,
    icon,
    color,
    frequencyType,
    frequencyValue,
    clerkId,
  } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const habit = await prisma.habit.create({
      data: {
        name,
        description,
        icon,
        color,
        frequencyType,
        frequencyValue,
        userId: user.id,
        streak: {
          create: { currentStreak: 0, longestStreak: 0 },
        },
      },
      include: { streak: true },
    });

    // Invalidate Redis caches
    await invalidateHabitCaches(clerkId, habit.id);

    res.status(201).json(habit);
  } catch (error) {
    console.error("Create Habit Error:", error);
    res.status(500).json({ error: "Failed to create habit" });
  }
};

export const getHabits = async (req: Request, res: Response): Promise<void> => {
  const clerkId = req.query.clerkId as string;
  const dateQuery = req.query.date as string;

  if (!clerkId) {
    res.status(400).json({ error: "clerkId is required" });
    return;
  }

  // Use provided date or default to today
  const targetDate = dateQuery
    ? startOfDay(new Date(dateQuery))
    : startOfDay(new Date());
  const dateStr = format(targetDate, "yyyy-MM-dd");
  const cacheKey = `habits:${clerkId}:${dateStr}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      res.json(JSON.parse(cached));
      return;
    }

    const start = startOfDay(targetDate);
    const end = endOfDay(targetDate);

    const habits = await prisma.habit.findMany({
      where: { user: { clerkId: String(clerkId) } },
      include: {
        streak: true,
        logs: {
          where: { date: { gte: start, lte: end } },
        },
      },
    });

    const habitsWithCompletion = habits.map((habit) => ({
      ...habit,
      completedToday: habit.logs.length > 0,
      logs: undefined, // Remove logs to keep response clean
    }));

    console.log(
      `[getHabits] Returning ${habitsWithCompletion.length} habits for clerkId: ${clerkId} on date: ${dateStr}`,
    );

    await redis.set(cacheKey, JSON.stringify(habitsWithCompletion), "EX", 300);
    res.json(habitsWithCompletion);
  } catch (error) {
    console.error("Get Habits Error:", error);
    res.status(500).json({ error: "Failed to fetch habits" });
  }
};

export const updateHabit = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { id } = req.params;
  const { name, description, icon, color, frequencyType, frequencyValue } =
    req.body;

  try {
    const habit = (await prisma.habit.update({
      where: { id: String(id) },
      data: {
        name,
        description,
        icon,
        color,
        frequencyType,
        frequencyValue,
      },
      include: { user: true },
    })) as any;

    // Invalidate Redis caches
    if (habit?.user?.clerkId) {
      await invalidateHabitCaches(habit.user.clerkId, String(id));
    }

    res.json(habit);
  } catch (error) {
    console.error("Update Habit Error:", error);
    res.status(500).json({ error: "Failed to update habit" });
  }
};

export const deleteHabit = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { id } = req.params;

  try {
    // We need clerkId for cache invalidation before deleting
    const habit = (await prisma.habit.findUnique({
      where: { id: String(id) },
      include: { user: true },
    })) as any;

    if (!habit) {
      res.status(404).json({ error: "Habit not found" });
      return;
    }

    const clerkId = habit?.user?.clerkId;

    // Delete the habit
    await prisma.habit.delete({ where: { id: String(id) } });

    // Invalidate Redis caches
    if (clerkId) {
      await invalidateHabitCaches(clerkId, String(id));
    }

    res.json({ message: "Habit deleted successfully" });
  } catch (error) {
    console.error("Delete Habit Error:", error);
    res.status(500).json({ error: "Failed to delete habit" });
  }
};

export const toggleHabitCompletion = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const id = req.params.id as string;
  const { date } = req.body;
  const targetDate = date ? startOfDay(new Date(date)) : startOfDay(new Date());
  const dateStr = format(targetDate, "yyyy-MM-dd");

  try {
    // Search for any log in the same 24h window for backward compatibility,
    // but normalize to startOfDay for new entries.
    const start = startOfDay(targetDate);
    const end = endOfDay(targetDate);

    const logs = await prisma.habitLog.findMany({
      where: {
        habitId: id,
        date: { gte: start, lte: end },
      },
    });

    const habit = await prisma.habit.findUnique({
      where: { id },
      include: { user: true },
    });
    const clerkId = habit?.user?.clerkId;

    if (logs.length > 0) {
      // If found, delete all logs for that day to be safe
      await prisma.habitLog.deleteMany({
        where: { id: { in: logs.map((l) => l.id) } },
      });
      await updateStreaks(id, targetDate);
      if (clerkId) await invalidateHabitCaches(clerkId, id, dateStr);
      res.json({ message: "Completion removed", status: false });
    } else {
      await prisma.habitLog.create({
        data: {
          habitId: id,
          date: targetDate, // Normalized to 00:00
        },
      });
      await updateStreaks(id, targetDate);
      if (clerkId) await invalidateHabitCaches(clerkId, id, dateStr);
      res.json({ message: "Habit completed", status: true });
    }
  } catch (error) {
    console.error("Toggle Completion Error:", error);
    res.status(500).json({ error: "Failed to toggle completion" });
  }
};

export const getHabitHeatmap = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const id = req.params.id as string;
  const cacheKey = `habit:heatmap:${id}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      res.json(JSON.parse(cached));
      return;
    }

    const oneYearAgo = subDays(new Date(), 365);
    const logs = await prisma.habitLog.findMany({
      where: {
        habitId: id,
        date: { gte: oneYearAgo },
      },
      orderBy: { date: "asc" },
    });

    const heatmap = logs.reduce((acc: any, log) => {
      const dateStr = format(log.date, "yyyy-MM-dd");
      acc[dateStr] = 1;
      return acc;
    }, {});

    await redis.set(cacheKey, JSON.stringify(heatmap), "EX", 3600); // 1 hour TTL
    res.json(heatmap);
  } catch (error) {
    console.error("Heatmap Error:", error);
    res.status(500).json({ error: "Failed to fetch heatmap data" });
  }
};

export const getWeeklyStats = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const clerkId = req.query.clerkId as string;

  if (!clerkId) {
    res.status(400).json({ error: "clerkId is required" });
    return;
  }

  const cacheKey = `stats:weekly:${clerkId}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      res.json(JSON.parse(cached));
      return;
    }

    const today = startOfDay(new Date());
    const sevenDaysAgo = subDays(today, 6);

    const logs = await prisma.habitLog.findMany({
      where: {
        habit: { user: { clerkId: String(clerkId) } },
        date: { gte: sevenDaysAgo, lte: today },
      },
      orderBy: { date: "asc" },
    });

    const dailyStats: Record<string, number> = {};
    for (let i = 0; i < 7; i++) {
      const dateStr = format(subDays(today, i), "EEE"); // Mon, Tue, etc.
      dailyStats[dateStr] = 0;
    }

    logs.forEach((log) => {
      const dateStr = format(log.date, "EEE");
      if (dailyStats.hasOwnProperty(dateStr)) {
        dailyStats[dateStr] += 1;
      }
    });

    const result = Object.entries(dailyStats)
      .map(([label, value]) => ({ label, value }))
      .reverse();

    await redis.set(cacheKey, JSON.stringify(result), "EX", 300); 
    res.json(result);
  } catch (error) {
    console.error("Weekly Stats Error:", error);
    res.status(500).json({ error: "Failed to fetch weekly stats" });
  }
};

export const getDetailedStats = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const clerkId = req.query.clerkId as string;

  if (!clerkId) {
    res.status(400).json({ error: "clerkId is required" });
    return;
  }

  const cacheKey = `stats:detailed:${clerkId}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      res.json(JSON.parse(cached));
      return;
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
      include: {
        habits: {
          include: {
            streak: true,
            _count: { select: { logs: true } },
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const today = startOfDay(new Date());
    const sevenDaysAgo = subDays(today, 6);

    // 1. Completion by Habit (Last 7 days)
    const habitsWithWeeklyCompletion = await Promise.all(
      user.habits.map(async (habit) => {
        const weeklyLogs = await prisma.habitLog.count({
          where: {
            habitId: habit.id,
            date: { gte: sevenDaysAgo, lte: today },
          },
        });
        return {
          id: habit.id,
          name: habit.name,
          color: habit.color,
          weeklyCompletions: weeklyLogs,
          completionRate: Math.round((weeklyLogs / 7) * 100),
          streak: habit.streak?.currentStreak || 0,
          longestStreak: habit.streak?.longestStreak || 0,
          totalLogs: habit._count.logs,
        };
      }),
    );

    // 2. Best & Worst Performing (based on completion rate last 7 days)
    const sortedByPerformance = [...habitsWithWeeklyCompletion].sort(
      (a, b) => b.completionRate - a.completionRate,
    );
    const bestHabits = sortedByPerformance.slice(0, 3);
    const worstHabits =
      sortedByPerformance.length > 3
        ? sortedByPerformance.slice(-3).reverse()
        : [];

    // 3. Category Breakdown
    const habitBreakdown = habitsWithWeeklyCompletion.map((h) => ({
      name: h.name,
      value: h.weeklyCompletions,
      color: h.color,
    }));

    // 4. Monthly Trend (Last 4 weeks)
    const monthlyTrend = await Promise.all(
      [21, 14, 7, 0].map(async (daysAgo) => {
        const start = subDays(today, daysAgo + 6);
        const end = subDays(today, daysAgo);
        const weeklyCount = await prisma.habitLog.count({
          where: {
            habit: { userId: user.id },
            date: { gte: start, lte: end },
          },
        });
        return {
          value: weeklyCount,
          label: `W${4 - daysAgo / 7}`,
        };
      }),
    );

    // 5. All Time Stats
    const totalLogs = await prisma.habitLog.count({
      where: { habit: { userId: user.id } },
    });

    const finalResult = {
      bestHabits,
      worstHabits,
      habitBreakdown,
      monthlyTrend,
      allTimeStats: {
        totalHabits: user.habits.length,
        totalLogs,
        bestEverStreak: Math.max(
          ...user.habits.map((h) => h.streak?.longestStreak || 0),
          0,
        ),
      },
    };

    await redis.set(cacheKey, JSON.stringify(finalResult), "EX", 300); // 5 min TTL
    res.json(finalResult);
  } catch (error) {
    console.error("Detailed Stats Error:", error);
    res.status(500).json({ error: "Failed to fetch detailed stats" });
  }
};

export const getHabitTrend = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { id } = req.params;
  const cacheKey = `habit:trend:${id}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      res.json(JSON.parse(cached));
      return;
    }

    const today = startOfDay(new Date());

    // Last 4 weeks
    const trend = await Promise.all(
      [21, 14, 7, 0].map(async (daysAgo) => {
        const start = subDays(today, daysAgo + 6);
        const end = subDays(today, daysAgo);
        const weeklyCount = await prisma.habitLog.count({
          where: {
            habitId: String(id),
            date: { gte: start, lte: end },
          },
        });
        return {
          value: weeklyCount,
          label: `W${4 - daysAgo / 7}`,
        };
      }),
    );

    await redis.set(cacheKey, JSON.stringify(trend), "EX", 300);
    res.json(trend);
  } catch (error) {
    console.error("Habit Trend Error:", error);
    res.status(500).json({ error: "Failed to fetch habit trend" });
  }
};

// Helper to update streaks
async function updateStreaks(habitId: string, referenceDate?: Date) {
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
