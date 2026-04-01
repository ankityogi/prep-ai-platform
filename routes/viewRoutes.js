const express = require("express");
const router = express.Router();
const viewController = require("../controllers/viewController");
const { checkLogin } = require("../middleware/auth");

router.get("/", viewController.index);
router.get("/register", viewController.register);
router.get("/dashboard", checkLogin, viewController.dashboard);
router.get("/live-interview", checkLogin, viewController.liveInterview);
router.get("/video-call", checkLogin, viewController.videoCall);
router.get("/profile", checkLogin, viewController.profile);
router.get("/interview", checkLogin, viewController.interview);
router.get("/coding", checkLogin, viewController.coding);
router.get("/results", checkLogin, viewController.results);
router.get("/leaderboard", checkLogin, viewController.leaderboard);
router.get("/resume", checkLogin, viewController.resume);
router.get("/top-questions", checkLogin, viewController.topQuestions);
router.get("/mock-test", checkLogin, viewController.mockTest);
router.get("/mock-test-home", checkLogin, viewController.mockTestHome);
router.get("/reviews", checkLogin, viewController.reviews);
router.get("/ats-scanner", checkLogin, viewController.atsScanner);

module.exports = router;
