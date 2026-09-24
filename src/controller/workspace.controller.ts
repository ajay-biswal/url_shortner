import type { Response } from "express";
import type { AuthRequest } from "../types/auth.js";
import { prisma } from "../lib/prisma.js";
import { createWorkspaceSchema } from "../validators/workspace.schema.js";

export async function createWorkspace(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  const parsed = createWorkspaceSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      message: "Invalid workspace data",
      errors: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  if (!req.user) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  const workspace = await prisma.workspace.create({
    data: {
      name: parsed.data.name,
      members: {
        create: {
          userId: req.user.userId,
          role: "OWNER",
        },
      },
    },
    select: {
      id: true,
      name: true,
      createdAt: true,
      members: {
        where: { userId: req.user.userId },
        select: { role: true },
      },
    },
  });

  res.status(201).json({
    id: workspace.id,
    name: workspace.name,
    createdAt: workspace.createdAt,
    role: workspace.members[0]?.role,
  });
}

export async function listWorkspaces(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  const memberships = await prisma.workspaceMember.findMany({
    where: { userId: req.user.userId },
    orderBy: { createdAt: "asc" },
    select: {
      role: true,
      workspace: {
        select: {
          id: true,
          name: true,
          createdAt: true,
        },
      },
    },
  });

  res.json(
    memberships.map(({ workspace, role }) => ({
      ...workspace,
      role,
    })),
  );
}

export async function getWorkspace(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  if (!req.workspaceId || !req.user) {
    res.status(400).json({ message: "Workspace context is required" });
    return;
  }

  const workspace = await prisma.workspace.findUnique({
    where: { id: req.workspaceId },
    select: {
      id: true,
      name: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!workspace) {
    res.status(404).json({ message: "Workspace not found" });
    return;
  }

  res.json(workspace);
}
