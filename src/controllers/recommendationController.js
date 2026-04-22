
const asyncHandler = require("../utils/asyncHandler");
const { buildProgramRecommendations } = require("../services/recommendationService");

const getRecommendations = asyncHandler(async (req, res) => {
  const result = await buildProgramRecommendations(req.params.studentId);
  res.json({ success: true, ...result });
});

module.exports = { getRecommendations };
