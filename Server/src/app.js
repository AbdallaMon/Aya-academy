import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { corsOptions } from "./config/cors.js";
import routes from "./routes.js";
import { UPLOAD_DIR } from "./modules/attachments/storage.js";
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

app.use("/uploads", express.static(UPLOAD_DIR));
app.use("/api/v1", routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
