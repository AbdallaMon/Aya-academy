import { ok } from "../../shared/http/response.js";
import { dashboardUsecase } from "./dashboard.usecase.js";

class DashboardController {
  async admin(req, res) {
    const data = await dashboardUsecase.getAdminDashboard({ authUser: req.auth });
    return ok(res, data);
  }

  async leaderboard(req, res) {
    const data = await dashboardUsecase.getLeaderboard({
      authUser: req.auth,
      limit: req.query.limit,
    });
    return ok(res, data);
  }

  async parent(req, res) {
    const data = await dashboardUsecase.getParentDashboard({ authUser: req.auth });
    return ok(res, data);
  }

  async student(req, res) {
    const data = await dashboardUsecase.getStudentDashboard({ authUser: req.auth });
    return ok(res, data);
  }
}

export const dashboardController = new DashboardController();
export { DashboardController };
