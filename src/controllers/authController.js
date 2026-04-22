

const jwt = require("jsonwebtoken");
const asyncHandler = require("../utils/asyncHandler");
const HttpError = require("../utils/httpError");
const Student = require("../models/Student");
const env = require("../config/env");

const register = asyncHandler(async (req, res) => {
  const { fullName, email, password, role, targetCountries, interestedFields, preferredIntake, maxBudgetUsd, englishTest } = req.body;
  if (!fullName || !email || !password) throw new HttpError(400, "fullName, email and password are required.");
  const existing = await Student.findOne({ email: email.toLowerCase().trim() });
  if (existing) throw new HttpError(409, "An account with that email already exists.");
  const student = await Student.create({
    fullName, email, password,
    role: role || "student",
    targetCountries: targetCountries || [],
    interestedFields: interestedFields || [],
    preferredIntake: preferredIntake || "",
    maxBudgetUsd: maxBudgetUsd || 0,
    englishTest: englishTest || { exam: "IELTS", score: 0 },
    profileComplete: !!(targetCountries?.length && interestedFields?.length && maxBudgetUsd),
  });
  const token = jwt.sign({ sub: student._id, role: student.role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
  res.status(201).json({
    success: true,
    data: { token, user: { id: student._id, fullName: student.fullName, email: student.email, role: student.role, profileComplete: student.profileComplete } },
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new HttpError(400, "email and password are required.");
  const student = await Student.findOne({ email: email.toLowerCase().trim() });
  if (!student) throw new HttpError(401, "Invalid credentials.");
  const match = await student.comparePassword(password);
  if (!match) throw new HttpError(401, "Invalid credentials.");
  const token = jwt.sign({ sub: student._id, role: student.role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
  res.json({
    success: true,
    data: { token, user: { id: student._id, fullName: student.fullName, email: student.email, role: student.role, profileComplete: student.profileComplete } },
  });
});

const me = asyncHandler(async (req, res) => {
  res.json({ success: true, data: req.user });
});

const updateMe = asyncHandler(async (req, res) => {
  const allowed = ["fullName","targetCountries","interestedFields","preferredIntake","maxBudgetUsd","englishTest"];
  const updates = {};
  allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
  const merged = { ...req.user.toObject(), ...updates };
  updates.profileComplete = !!(merged.targetCountries?.length && merged.interestedFields?.length && merged.maxBudgetUsd);
  const updated = await Student.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true }).select("-password");
  res.json({ success: true, data: updated });
});

module.exports = { register, login, me, updateMe };