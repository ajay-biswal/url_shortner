import type { NextFunction, Response } from "express";
import type { AuthRequest } from "../types/auth.js";
import { prisma } from "../lib/prisma.js";

export async function requireWorkspaceMember(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const userId = req.user?.userId;
  const workspaceId = req.header("x-workspace-id");

  if (!userId) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  if (!workspaceId) {
    res.status(400).json({ message: "x-workspace-id header is required" });
    return;
  }

  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId,
      },
    },
  });

  if (!membership) {
    res.status(403).json({ message: "You are not a member of this workspace" });
    return;
  }

  req.workspaceId = workspaceId;
  next();
}
