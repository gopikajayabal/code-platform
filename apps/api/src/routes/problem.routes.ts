import { Router } from "express";
import {
  getProblems,
  getProblemBySlug,
  createProblem,
  updateProblem,
  deleteProblem,
} from "../controllers/problem.controller";

import { requireAdmin } from "../middleware/admin.middleware";

const router = Router();

router.get("/", getProblems);
router.get("/:slug", getProblemBySlug);

router.post("/", requireAdmin, createProblem);
router.put("/:id", requireAdmin, updateProblem);
router.delete("/:id", requireAdmin, deleteProblem);

export default router;