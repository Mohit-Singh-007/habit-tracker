import { Router } from "express";
import { syncUser } from "../controllers/userController";

const router = Router();

// Endpoint for mobile app to sync user data after Clerk login
router.post("/sync", syncUser);

export default router;
