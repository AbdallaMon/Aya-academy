import { Router } from "express";
import gameRoutes from "./games/game.route.js";
import quizRoutes from "./quizzes/quiz.route.js";
import badgeRoutes from "./badges/badge.route.js";
import pointRoutes from "./points/point.route.js";
import rewardRoutes from "./rewards/reward.route.js";

const gamificationRoutes = Router();

gamificationRoutes.use("/games", gameRoutes);
gamificationRoutes.use("/quizzes", quizRoutes);
gamificationRoutes.use("/badges", badgeRoutes);
gamificationRoutes.use("/points", pointRoutes);
gamificationRoutes.use("/rewards", rewardRoutes);

export default gamificationRoutes;
