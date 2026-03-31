const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const mongoose = require("mongoose");

mongoose.connect("mongodb://127.0.0.1:27017/loginDB")
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.error("MongoDB error:", err));

const questionSchema = new mongoose.Schema({
    question: String,
    options: [String],
    correctAnswer: String,
    type: String,
    category: String,
    branch: String
});

const Question = mongoose.model("Question", questionSchema);

const csvFilePath = path.join(__dirname, "../data/tcs_questions.csv");

const questions = [];

fs.createReadStream(csvFilePath)
    .pipe(csv())
    .on("data", (row) => {

        questions.push({
            question: row.question,
            options: [
                row.optionA,
                row.optionB,
                row.optionC,
                row.optionD
            ],
            correctAnswer: row.correctAnswer,
            type: row.type,
            category: row.category,
            branch: row.branch
        });

    })
    .on("end", async () => {
        try {
            await Question.insertMany(questions);
            console.log("TCS questions imported successfully");
        } catch (err) {
            console.error(err);
        } finally {
            mongoose.connection.close();
        }
    });
