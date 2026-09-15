const dashboardService = require("../services/dashboard.service.js");

async function getDashboard(req, res, next) {
  try {
    const metricas = await dashboardService.buscarMetricas();
    res.status(200).json(metricas);
  } catch (err) {
    next(err);
  }
}

module.exports = { getDashboard };
