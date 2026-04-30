import { Request, Response } from "express";
import prisma from "../lib/prisma";

export const syncUser = async (req: Request, res: Response): Promise<void> => {
  const { clerkId, email, name } = req.body;

  if (!clerkId) {
    res.status(400).json({ error: "clerkId is required" });
    return;
  }

  try {
    const user = await prisma.user.upsert({
      where: { clerkId },
      update: { email, name },
      create: { clerkId, email, name },
    });

    res.json(user);
  } catch (error) {
    console.error("Sync User Error:", error);
    res.status(500).json({ error: "Failed to sync user" });
  }
};
