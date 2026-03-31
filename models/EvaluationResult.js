const mongoose = require("mongoose");

const evaluationResultSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    type: {
        type: String,
        enum: ['interview', 'code', 'behavioral'],
        required: true
    },
    question: {
        type: String,
        required: true
    },
    answer: {
        type: String,
        required: true
    },
    score: {
        type: Number,
        required: true
    },
    feedback: {
        type: String,
        required: true
    },
    language: String, // Specifically for coding tests
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("EvaluationResult", evaluationResultSchema);
