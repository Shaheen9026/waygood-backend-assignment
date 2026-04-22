const Application = require("../models/Application");
const asyncHandler = require("../utils/asyncHandler");
const HttpError = require("../utils/httpError");

const listApplications = asyncHandler(async (req, res) => {
  const { studentId, status } = req.query;
  const filters = {};

  if (studentId) {
    filters.student = studentId;
  }

  if (status) {
    filters.status = status;
  }

  const applications = await Application.find(filters)
    .populate("student", "fullName email role")
    .populate("program", "title degreeLevel tuitionFeeUsd")
    .populate("university", "name country city")
    .sort({ createdAt: -1 })
    .lean();

  res.json({
    success: true,
    data: applications,
  });
});

 const createApplication = asyncHandler(async (req, res) => {
  const { student, program, university, destinationCountry, intake } = req.body;

  
  if (!student || !program || !university || !destinationCountry || !intake) {
    throw new HttpError(400, "All fields are required");
  }

  
  const existing = await Application.findOne({
    student,
    program,
    intake,
  });

  if (existing) {
    throw new HttpError(400, "Application already exists for this program & intake");
  }

  
  const newApp = await Application.create({
    student,
    program,
    university,
    destinationCountry,
    intake,
    status: "draft",
    timeline: [{ status: "draft", note: "Application created" }],
  });

  res.status(201).json({
    success: true,
    data: newApp,
  });
});


const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, note } = req.body;

  const application = await Application.findById(id);

  if (!application) {
    throw new HttpError(404, "Application not found");
  }

  
  application.status = status;

  
  application.timeline.push({
    status,
    note: note || `Status changed to ${status}`,
  });

  await application.save();

  res.json({
    success: true,
    data: application,
  });
});

module.exports = {
  createApplication,
  listApplications,
  updateApplicationStatus,
};
