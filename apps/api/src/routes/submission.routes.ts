import { Router } from "express";
import {
  createSubmission,
  getMySubmissions,
  getLeaderboard,
  getMyStats,
  getAllSubmissionsForAdmin,
  getMyLanguageProgress,
} from "../controllers/submission.controller";

const router = Router();

router.post("/", createSubmission);
router.get("/me", getMySubmissions);
router.get("/leaderboard", getLeaderboard);
router.get("/stats", getMyStats);
router.get("/progress", getMyLanguageProgress);
router.get("/admin/all", getAllSubmissionsForAdmin);

export default router;