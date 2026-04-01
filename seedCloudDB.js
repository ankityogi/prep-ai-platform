require("dotenv").config();
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const mongoose = require("mongoose");
const Question = require("./models/Question");

const uri = process.env.MONGO_URI;

if (!uri || uri.includes("127.0.0.1")) {
    console.error("❌ ERROR: Your .env file is still pointing to your local 127.0.0.1 database!");
    console.error("Please change MONGO_URI in your .env to your MongoDB Atlas string.");
    process.exit(1);
}

const csvFiles = [
    "amazon_questions.csv", "cn_questions.csv", "dbms_questions.csv",
    "ds_questions.csv", "google_questions.csv", "microsoft_questions.csv",
    "oops_questions.csv", "os_questions.csv", "se_questions.csv", "tcs_questions.csv"
];

async function seedToCloud() {
    try {
        await mongoose.connect(uri);
        console.log("✅ Successfully connected to MongoDB Atlas Cloud!");

        // Optional: clear existing to prevent duplicates if you run it twice
        await Question.deleteMany({});
        console.log("🧹 Cleared any old/duplicate questions.");

        for (const file of csvFiles) {
            const filePath = path.join(__dirname, "data", file);
            if (!fs.existsSync(filePath)) continue;

            const questions = [];
            await new Promise((resolve, reject) => {
                fs.createReadStream(filePath)
                    .pipe(csv())
                    .on("data", (row) => {
                        questions.push({
                            question: row.question,
                            options: [row.optionA, row.optionB, row.optionC, row.optionD],
                            correctAnswer: row.correctAnswer,
                            type: row.type,
                            category: row.category,
                            branch: row.branch
                        });
                    })
                    .on("end", async () => {
                        if (questions.length > 0) {
                            await Question.insertMany(questions);
                            console.log(`📥 Imported ${questions.length} questions from ${file}`);
                        }
                        resolve();
                    })
                    .on("error", reject);
            });
        }

        console.log("🎉 ALL QUESTIONS SUCCESSFULLY IMPORTED TO THE CLOUD!");
        process.exit(0);

    } catch (err) {
        console.error("Database connection failed:", err);
        process.exit(1);
    }
}

seedToCloud();
