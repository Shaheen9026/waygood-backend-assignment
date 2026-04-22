

const mongoose = require("mongoose");
const Program = require("../models/Program");
const Student = require("../models/Student");
const HttpError = require("../utils/httpError");

async function buildProgramRecommendations(studentId) {
  let objectId;
  try {
    objectId = new mongoose.Types.ObjectId(studentId);
  } catch {
    throw new HttpError(400, "Invalid studentId format.");
  }

  const student = await Student.findById(objectId).lean();
  if (!student) throw new HttpError(404, "Student not found.");

  const { targetCountries = [], interestedFields = [], preferredIntake = "", maxBudgetUsd = 0, englishTest = {} } = student;
  const ieltsScore = englishTest?.score || 0;
  const fieldRegexes = interestedFields.map((f) => new RegExp(f, "i"));

  const pipeline = [
    { $match: { ...(targetCountries.length ? { country: { $in: targetCountries } } : {}) } },
    {
      $addFields: {
        countryScore: { $cond: [{ $in: ["$country", targetCountries] }, 35, 0] },
        fieldScore: {
          $cond: [
            {
              $gt: [
                {
                  $size: {
                    $filter: {
                      input: fieldRegexes.map((r) => r.source),
                      as: "pattern",
                      cond: { $regexMatch: { input: { $toLower: "$field" }, regex: "$$pattern", options: "i" } },
                    },
                  },
                },
                0,
              ],
            },
            30, 0,
          ],
        },
        budgetScore: { $cond: [{ $lte: ["$tuitionFeeUsd", maxBudgetUsd] }, 20, 0] },
        intakeScore: {
          $cond: [{ $and: [{ $ne: [preferredIntake, ""] }, { $in: [preferredIntake, "$intakes"] }] }, 10, 0],
        },
        ieltsScore: { $cond: [{ $gte: [ieltsScore, "$minimumIelts"] }, 5, 0] },
      },
    },
    {
      $addFields: {
        matchScore: { $add: ["$countryScore", "$fieldScore", "$budgetScore", "$intakeScore", "$ieltsScore"] },
      },
    },
    { $match: { matchScore: { $gt: 0 } } },
    { $sort: { matchScore: -1, tuitionFeeUsd: 1 } },
    { $limit: 8 },
    {
      $addFields: {
        reasons: {
          $filter: {
            input: [
              { $cond: [{ $gt: ["$countryScore", 0] }, { $concat: ["Preferred country match: ", "$country"] }, "$$REMOVE"] },
              { $cond: [{ $gt: ["$fieldScore", 0] }, { $concat: ["Field alignment: ", "$field"] }, "$$REMOVE"] },
              { $cond: [{ $gt: ["$budgetScore", 0] }, "Within budget range", "$$REMOVE"] },
              { $cond: [{ $gt: ["$intakeScore", 0] }, { $concat: ["Preferred intake available: ", preferredIntake] }, "$$REMOVE"] },
              { $cond: [{ $gt: ["$ieltsScore", 0] }, "English test score meets requirement", "$$REMOVE"] },
            ],
            as: "r",
            cond: { $ne: ["$$r", null] },
          },
        },
      },
    },
    { $project: { countryScore: 0, fieldScore: 0, budgetScore: 0, intakeScore: 0, ieltsScore: 0 } },
  ];

  const recommendations = await Program.aggregate(pipeline);

  return {
    data: {
      student: { id: student._id, fullName: student.fullName, targetCountries, interestedFields, preferredIntake, maxBudgetUsd, ielts: ieltsScore },
      recommendations,
      total: recommendations.length,
    },
    meta: {
      engine: "mongodb-aggregation-v2",
      scoringWeights: { countryMatch: 35, fieldMatch: 30, budgetFit: 20, intakeMatch: 10, ieltsMin: 5 },
    },
  };
}

module.exports = { buildProgramRecommendations };