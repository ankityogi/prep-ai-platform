const mongoose = require("mongoose");

const mockTestResultSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    questions: [mongoose.Schema.Types.Mixed],
    answers: [String],
    score: Number,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("MockTestResult", mockTestResultSchema);
