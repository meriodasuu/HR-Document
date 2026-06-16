import express, { type Express } from "express";
import type { ErrorRequestHandler } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json({ limit: "8mb" }));
app.use(express.urlencoded({ extended: true, limit: "8mb" }));

app.get("/", (_req, res) => {
  res.json({
    status: "ok",
    service: "HR Document API",
    health: "/api/healthz",
  });
});

app.use("/api", router);

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err?.name === "ZodError") {
    return res.status(400).json({
      error: "Invalid request data",
      details: err.issues,
    });
  }

  logger.error({ err }, "Unhandled API error");
  return res.status(500).json({ error: "Internal server error" });
};

app.use(errorHandler);

export default app;
