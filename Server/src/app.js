import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { corsOptions } from "./config/cors.js";
import routes from "./routes.js";
import {
  errorHandler,
  notFoundHandler,
} from "./shared/errors/error-handler.js";

const app = express();

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
app.use(cors(corsOptions));
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// NOTE: uploads are NOT served statically/publicly. They are streamed only to
// authenticated users via GET /api/v1/attachments/:id/raw (see attachments module).
app.use("/api/v1", routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
