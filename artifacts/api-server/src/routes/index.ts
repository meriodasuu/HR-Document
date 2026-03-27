import { Router, type IRouter } from "express";
import healthRouter from "./health";
import employeesRouter from "./employees";
import documentsRouter from "./documents";
import templatesRouter from "./templates";
import statsRouter from "./stats";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/employees", employeesRouter);
router.use("/documents", documentsRouter);
router.use("/templates", templatesRouter);
router.use("/stats", statsRouter);

export default router;
