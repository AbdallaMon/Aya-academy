import { Router } from "express";
import subscriptionRoutes from "./subscriptions/subscription.route.js";
import invoiceRoutes from "./invoices/invoice.route.js";
import planRoutes from "./plans/plan.route.js";
import couponRoutes from "./coupons/coupon.route.js";
import paymentTemplateRoutes from "./paymentTemplates/paymentTemplate.route.js";

const financeRoutes = Router();

financeRoutes.use("/subscriptions", subscriptionRoutes);
financeRoutes.use("/invoices", invoiceRoutes);
financeRoutes.use("/plans", planRoutes);
financeRoutes.use("/coupons", couponRoutes);
financeRoutes.use("/payment-templates", paymentTemplateRoutes);

export default financeRoutes;
