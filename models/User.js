const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
    profilePhoto: String,
    bio: String,
    skills: String,
    college: String,
    year: String,
    avatar: String,
    resumeUrl: String,
    resumeText: String,
    currentStreak: { type: Number, default: 0 },
    lastPracticeDate: { type: Date, default: null }
});

module.exports = mongoose.model("User", userSchema);
