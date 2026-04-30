import { Router } from "express";
import { 
  createHabit, 
  getHabits, 
  toggleHabitCompletion, 
  getHabitHeatmap,
  getWeeklyStats,
  getDetailedStats,
  getHabitTrend,
  updateHabit,
  deleteHabit 
} from "../controllers/habitController";

const router = Router();

router.post("/", createHabit);
router.get("/", getHabits);
router.get("/stats/weekly", getWeeklyStats);
router.get("/stats/detailed", getDetailedStats);
router.patch("/:id", updateHabit);
router.delete("/:id", deleteHabit);
router.post("/:id/toggle", toggleHabitCompletion);
router.get("/:id/heatmap", getHabitHeatmap);
router.get("/:id/trend", getHabitTrend);

export default router;
