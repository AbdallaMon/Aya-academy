import { Router } from "express";
import sessionLogRoutes from "./sessionLogs/sessionLog.route.js";
import whiteboardSessionRoutes from "./whiteboardSessions/whiteboardSession.route.js";
import reportRoutes from "./reports/report.route.js";

const sessionsRoutes = Router();

sessionsRoutes.use("/session-logs", sessionLogRoutes);
sessionsRoutes.use("/whiteboard-sessions", whiteboardSessionRoutes);
sessionsRoutes.use("/reports", reportRoutes);

export default sessionsRoutes;
