import { Router } from "express";
import healthRouter from "./health";
import employeesRouter from "./employees";
import documentsRouter from "./documents";
import templatesRouter from "./templates";
import statsRouter from "./stats";
import authRouter from "./auth";
import { authMiddleware } from "../lib/auth";

const router = Router();

router.use(healthRouter);
router.use("/auth", authRouter);

router.use("/employees", authMiddleware, employeesRouter);
router.use("/documents", authMiddleware, documentsRouter);
router.use("/templates", authMiddleware, templatesRouter);
router.use("/stats", authMiddleware, statsRouter);

export default router;
