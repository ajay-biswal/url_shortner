import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { createAccessToken } from "../lib/jwt.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import { loginSchema, registerSchema } from "../validators/auth.schema.js";

export async function register(req: Request, res: Response): Promise<void> {
  const parsed = registerSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      message: "Invalid registration data",
      errors: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const email = parsed.data.email.toLowerCase();

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    res.status(409).json({ message: "An account with this email already exists" });
    return;
  }

  const passwordHash = await hashPassword(parsed.data.password);

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        passwordHash,
      },
    });

    const workspace = await tx.workspace.create({
      data: {
        name: parsed.data.workspaceName,
      },
    });

    await tx.workspaceMember.create({
      data: {
        workspaceId: workspace.id,
        userId: user.id,
        role: "OWNER",
      },
    });

    return { user, workspace };
  });

  const accessToken = createAccessToken({
    userId: result.user.id,
    email: result.user.email,
  });

  res.status(201).json({
    accessToken,
    user: {
      id: result.user.id,
      email: result.user.email,
    },
    workspace: {
      id: result.workspace.id,
      name: result.workspace.name,
      role: "OWNER",
    },
  });
}

export async function login(req: Request, res: Response): Promise<void> {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      message: "Invalid login data",
      errors: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const email = parsed.data.email.toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    res.status(401).json({ message: "Invalid email or password" });
    return;
  }

  const accessToken = createAccessToken({
    userId: user.id,
    email: user.email,
  });

  res.status(200).json({
    accessToken,
    user: {
      id: user.id,
      email: user.email,
    },
  });
}

export async function me(req: Request, res: Response): Promise<void> {
  const authReq = req as Request & { user?: { userId: string; email: string } };

  if (!authReq.user) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: authReq.user.userId },
    select: {
      id: true,
      email: true,
      createdAt: true,
      memberships: {
        select: {
          role: true,
          workspace: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  res.json(user);
}
