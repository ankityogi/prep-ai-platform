const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
    question: String,
    options: [String],
    correctAnswer: String,
    type: String,      // subject / company
    category: String,  // DBMS, OS, Google etc
    branch: String,     // CSE
    introVideo: String
});

module.exports = mongoose.model("Question", questionSchema);
