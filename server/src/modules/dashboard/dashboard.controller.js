import { ok } from "../../shared/http/response.js";
import { dashboardUsecase } from "./dashboard.usecase.js";

class DashboardController {
  admin = async (req, res) => {
    const data = await dashboardUsecase.getAdminDashboard(req.auth);
    return ok(res, data);
  };

  leaderboard = async (req, res) => {
    const data = await dashboardUsecase.getLeaderboard({
      authUser: req.auth,
      limit: req.query.limit,
    });
    return ok(res, data);
  };

  parent = async (req, res) => {
    const data = await dashboardUsecase.getParentDashboard(req.auth);
    return ok(res, data);
  };

  student = async (req, res) => {
    const data = await dashboardUsecase.getStudentDashboard(req.auth);
    return ok(res, data);
  };
}

export const dashboardController = new DashboardController();
