import { Router } from "express";
import {
  createWorkspace,
  getWorkspace,
  listWorkspaces,
} from "../controller/workspace.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireWorkspaceMember } from "../middleware/workspace.middleware.js";

const router = Router();

router.use(requireAuth);

router.post("/", createWorkspace);
router.get("/", listWorkspaces);
router.get("/current", requireWorkspaceMember, getWorkspace);

export default router;
