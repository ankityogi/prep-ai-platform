const express = require("express");
const router = express.Router();
const apiController = require("../controllers/apiController");
const { checkLogin } = require("../middleware/auth");
const { uploadPhoto, uploadVideo, upload } = require("../middleware/upload");
const rateLimit = require("express-rate-limit");

const aiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20, // Increased general API limit slightly
    message: { error: "Too many AI requests from this IP, please try again after 15 minutes" }
});

const liveLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300, // 300 requests per 15 mins for the live coach (since it runs every 8 seconds)
    message: { error: "Too many Live Feedback requests." }
});

router.get("/profile", checkLogin, apiController.getProfile);
router.post("/profile", checkLogin, apiController.updateProfile);
router.post("/profile/photo", checkLogin, uploadPhoto.single("photo"), apiController.uploadProfilePhoto);
router.post("/profile/video", checkLogin, uploadVideo.single("video"), apiController.uploadIntroVideo);

router.post("/reviews", checkLogin, apiController.createReview);
router.get("/reviews", apiController.getReviews);

router.get("/performance-summary", checkLogin, apiController.getPerformanceSummary);
router.get("/results/data", checkLogin, apiController.getResultsData);
router.get("/results/export", checkLogin, apiController.exportPDFReport);
router.get("/leaderboard/data", checkLogin, apiController.getLeaderboardData);

router.post("/ai/question", checkLogin, aiLimiter, apiController.generateAIQuestion);
router.post("/ai/live-feedback", checkLogin, liveLimiter, apiController.liveFeedback);
router.post("/ai/evaluate", checkLogin, aiLimiter, apiController.evaluateAnswer);

router.post("/mock-test/start", checkLogin, apiController.startMockTest);
router.post("/mock-test/submit", checkLogin, apiController.submitMockTest);

router.post("/resume-upload", checkLogin, upload.single("resume"), apiController.uploadAndParseResume);

module.exports = router;
