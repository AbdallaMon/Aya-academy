import { Router } from "express";
import certificateRoutes from "./certificates/certificate.route.js";
import certificateTemplateRoutes from "./certificateTemplates/certificateTemplate.route.js";

const learningRoutes = Router();

learningRoutes.use("/certificates", certificateRoutes);
learningRoutes.use("/certificate-templates", certificateTemplateRoutes);

export default learningRoutes;
