import type { Request, Response, NextFunction } from "express";
import crypto from "crypto";

export type UserRole = "hr" | "director";

const HR_USERNAME = process.env.HR_USERNAME ?? "hr";
const HR_PASSWORD = process.env.HR_PASSWORD ?? "hr2024";
const DIRECTOR_USERNAME = process.env.DIRECTOR_USERNAME ?? "director";
const DIRECTOR_PASSWORD = process.env.DIRECTOR_PASSWORD ?? "director2024";

const activeSessions = new Map<string, { username: string; role: UserRole; expiresAt: number }>();

const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function createSession(username: string, role: UserRole): string {
  const token = generateToken();
  activeSessions.set(token, { username, role, expiresAt: Date.now() + SESSION_TTL_MS });
  return token;
}

export function validateSession(token: string): { username: string; role: UserRole } | null {
  const session = activeSessions.get(token);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    activeSessions.delete(token);
    return null;
  }
  return { username: session.username, role: session.role };
}

export function destroySession(token: string): void {
  activeSessions.delete(token);
}

export function checkCredentials(username: string, password: string): { username: string; role: UserRole } | null {
  if (username === HR_USERNAME && password === HR_PASSWORD) {
    return { username, role: "hr" };
  }
  if (username === DIRECTOR_USERNAME && password === DIRECTOR_PASSWORD) {
    return { username, role: "director" };
  }
  return null;
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
