import express, { type Express, type ErrorRequestHandler } from "express";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { PortalError } from "./lib/portal-rules";

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
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  if (["POST", "PATCH", "PUT", "DELETE"].includes(req.method)) {
    const origin = req.get("origin");
    const host = req.get("x-forwarded-host")?.split(",")[0].trim() ?? req.get("host");
    if (req.get("sec-fetch-site") === "cross-site" || (origin && new URL(origin).host !== host)) {
      res.status(403).json({ error: "동일한 사이트에서만 변경할 수 있습니다." });
      return;
    }
  }
  next();
});

app.use("/api", router);
const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof PortalError) { res.status(err.status).json({ error: err.message }); return; }
  if (err?.name === "ZodError") { res.status(400).json({ error: "입력 데이터 형식이 올바르지 않습니다.", details: err.issues }); return; }
  req.log.error({ err }, "Portal request failed");
  res.status(500).json({ error: "서버에서 처리하지 못했습니다. 잠시 후 다시 시도해 주세요." });
};
app.use(errorHandler);

export default app;
