import { Router, type IRouter } from "express";
import { checkCredentials, createSession, destroySession, validateSession } from "../lib/auth";

const router: IRouter = Router();

router.post("/login", (req, res) => {
  const { username, password } = req.body ?? {};
  if (!username || !password) {
    return res.status(400).json({ error: "Укажите имя пользователя и пароль" });
  }
  if (!checkCredentials(username, password)) {
    return res.status(401).json({ error: "Неверные учётные данные" });
  }
  const token = createSession(username);
  res.json({ token, username });
});

router.post("/logout", (req, res) => {
  const authHeader = req.headers["authorization"];
  if (authHeader?.startsWith("Bearer ")) {
    destroySession(authHeader.slice(7));
  }
  res.json({ success: true });
});

router.get("/me", (req, res) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Не авторизован" });
  }
  const session = validateSession(authHeader.slice(7));
  if (!session) {
    return res.status(401).json({ error: "Сессия истекла" });
  }
  res.json({ username: session.username });
});

export default router;
