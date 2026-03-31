require("dotenv").config({ path: "../.env" });

const mongoose = require("mongoose");
const fs = require("fs");
const csv = require("csv-parser");

const questionSchema = new mongoose.Schema({
    question: String,
    options: [String],
    correctAnswer: String,
    type: String,
    category: String,
    branch: String
});

const Question = mongoose.model("Question", questionSchema);

async function run() {

    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");

    const results = [];

    fs.createReadStream("../data/google_questions.csv")
        .pipe(csv())
        .on("data", (row) => {

            results.push({
                question: row.question,
                options: [
                    row.optionA,
                    row.optionB,
                    row.optionC,
                    row.optionD
                ],
                correctAnswer: row.correctAnswer,
                type: row.type,           // company
                category: row.category,  // Google
                branch: row.branch       // CSE
            });

        })
        .on("end", async () => {

            await Question.insertMany(results);

            console.log("Google questions imported successfully");

            await mongoose.disconnect();
            process.exit();
        });
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});


