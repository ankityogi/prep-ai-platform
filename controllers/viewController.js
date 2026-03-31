const path = require("path");

// The base directory for views is one level up, in /views
const getPath = (filename) => path.join(__dirname, "..", "views", filename);

const index = (req, res) => res.render("index");
const register = (req, res) => res.render("register");

const dashboard = (req, res) => res.render("dashboard");

const liveInterview = (req, res) => {
    const roomId = "Interview-" + req.session.userId + "-" + Date.now();
    res.redirect("/video-call?room=" + roomId);
};

const videoCall = (req, res) => res.render("video-call");
const profile = (req, res) => res.render("profile");
const interview = (req, res) => res.render("interview");
const coding = (req, res) => res.render("coding");
const results = (req, res) => res.render("results");
const leaderboard = (req, res) => res.render("leaderboard");
const resume = (req, res) => res.render("resume");
const topQuestions = (req, res) => res.render("top-questions");
const mockTest = (req, res) => res.render("mock-test");
const mockTestHome = (req, res) => res.render("mock-test-home");
const reviews = (req, res) => res.render("reviews");

module.exports = {
    index,
    register,
    dashboard,
    liveInterview,
    videoCall,
    profile,
    interview,
    coding,
    results,
    leaderboard,
    resume,
    topQuestions,
    mockTest,
    mockTestHome,
    reviews
};
