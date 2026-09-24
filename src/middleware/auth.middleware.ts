import type { NextFunction, Response } from "express";
import type { AuthRequest } from "../types/auth.js";
import { verifyAccessToken } from "../lib/jwt.js";

export function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void {
  const authorization = req.header("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  try {
    req.user = verifyAccessToken(authorization.slice(7));
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired access token" });
  }
}
