import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.routes";
import problemRoutes from "./routes/problem.routes";
import submissionRoutes from "./routes/submission.routes";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "Code Platform API Running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/problems", problemRoutes);
app.use("/api/submissions", submissionRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});