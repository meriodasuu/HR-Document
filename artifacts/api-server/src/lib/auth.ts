import type { Request, Response, NextFunction } from "express";
import crypto from "crypto";

const HR_USERNAME = process.env.HR_USERNAME ?? "hr";
const HR_PASSWORD = process.env.HR_PASSWORD ?? "hr2024";

const activeSessions = new Map<string, { username: string; expiresAt: number }>();

const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function createSession(username: string): string {
  const token = generateToken();
  activeSessions.set(token, { username, expiresAt: Date.now() + SESSION_TTL_MS });
  return token;
}

export function validateSession(token: string): { username: string } | null {
  const session = activeSessions.get(token);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    activeSessions.delete(token);
    return null;
  }
  return { username: session.username };
}

export function destroySession(token: string): void {
  activeSessions.delete(token);
}

export function checkCredentials(username: string, password: string): boolean {
  return username === HR_USERNAME && password === HR_PASSWORD;
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Требуется авторизация" });
  }
  const token = authHeader.slice(7);
  const session = validateSession(token);
  if (!session) {
    return res.status(401).json({ error: "Сессия истекла или недействительна" });
  }
  (req as any).user = session;
  next();
}
