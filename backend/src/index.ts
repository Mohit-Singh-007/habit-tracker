import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import userRoutes from "./routes/userRoutes";
import habitRoutes from "./routes/habitRoutes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Health Check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api/users", userRoutes);
app.use("/api/habits", habitRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
