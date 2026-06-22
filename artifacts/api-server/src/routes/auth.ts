import { Router, type Request, type Response } from "express";
import { checkCredentials, createSession, destroySession, validateSession } from "../lib/auth";

const router = Router();

router.post("/login", (req: Request, res: Response) => {
  const { username, password } = req.body ?? {};
  if (!username || !password) {
    return res.status(400).json({ error: "Укажите имя пользователя и пароль" });
  }
  const user = checkCredentials(username, password);
  if (!user) {
    return res.status(401).json({ error: "Неверные учётные данные" });
  }
  const token = createSession(user.username, user.role);
  res.json({ token, username: user.username, role: user.role });
});

router.post("/logout", (req: Request, res: Response) => {
  const authHeader = req.headers["authorization"];
  if (authHeader?.startsWith("Bearer ")) {
    destroySession(authHeader.slice(7));
  }
  res.json({ success: true });
});

router.get("/me", (req: Request, res: Response) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Не авторизован" });
  }
  const session = validateSession(authHeader.slice(7));
  if (!session) {
    return res.status(401).json({ error: "Сессия истекла" });
  }
  res.json({ username: session.username, role: session.role });
});

export default router;
