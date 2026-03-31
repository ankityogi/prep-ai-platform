require("dotenv").config();
const mongoose = require("mongoose");
const fs = require("fs");
const csv = require("csv-parser");

async function run() {

    await mongoose.connect("mongodb://127.0.0.1:27017/loginDB");
    console.log("MongoDB connected");

    const questionSchema = new mongoose.Schema({
        question: String,
        options: [String],
        correctAnswer: String,
        type: String,
        category: String,
        branch: String
    });

    const Question = mongoose.model("Question", questionSchema);

    const rows = [];

    fs.createReadStream("../data/dbms_questions.csv")
        .pipe(csv())
        .on("data", (row) => {
            rows.push(row);
        })
        .on("end", async () => {

            for (const row of rows) {

                await Question.create({
                    question: row.question,
                    options: [
                        row.option1,
                        row.option2,
                        row.option3,
                        row.option4
                    ],
                    correctAnswer: row.correct,
                    type: row.type,
                    category: row.category,
                    branch: "CSE"
                });
            }

            console.log("DBMS questions imported successfully");
            process.exit();
        });
}

run();
