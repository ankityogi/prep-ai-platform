const User = require("../models/User");
const Review = require("../models/Review");
const MockTestResult = require("../models/MockTestResult");
const EvaluationResult = require("../models/EvaluationResult");
const Question = require("../models/Question");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const PDFDocument = require("pdfkit");

// Gamification Helper: Update Daily Streak
const updateStreak = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) return;

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        if (!user.lastPracticeDate) {
            user.currentStreak = 1;
            user.lastPracticeDate = today;
            await user.save();
            return;
        }

        const lastDate = new Date(user.lastPracticeDate);
        const diffTime = Math.abs(today - lastDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            user.currentStreak += 1;
            user.lastPracticeDate = today;
            await user.save();
        } else if (diffDays > 1) {
            user.currentStreak = 1;
            user.lastPracticeDate = today;
            await user.save();
        }
    } catch (err) {
        console.error("Streak calculation error:", err);
    }
};

const getProfile = async (req, res) => {
    const user = await User.findById(req.session.userId).select("-password");
    res.json(user);
};

const updateProfile = async (req, res) => {
    try {
        const { bio, skills, college, year } = req.body;
        await User.findByIdAndUpdate(req.session.userId, {
            bio,
            skills,
            college,
            year
        });
        res.json({ message: "Profile saved successfully ✅" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error saving profile" });
    }
};

const uploadProfilePhoto = async (req, res) => {
    try {
        const photoPath = "/uploads/profile/" + req.file.filename;
        await User.findByIdAndUpdate(req.session.userId, {
            profilePhoto: photoPath
        });
        res.json({ message: "Photo uploaded successfully", photo: photoPath });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Photo upload failed" });
    }
};

const uploadIntroVideo = async (req, res) => {
    try {
        const videoPath = "/uploads/videos/" + req.file.filename;
        await User.findByIdAndUpdate(req.session.userId, {
            introVideo: videoPath
        });
        res.json({ message: "Video uploaded successfully", video: videoPath });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Video upload failed" });
    }
};

const uploadAndParseResume = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });

        // 1. Read PDF file directly from multer memory buffer
        const dataBuffer = req.file.buffer;

        // 2. Parse text
        const pdfData = await pdfParse(dataBuffer);
        const resumeText = pdfData.text;

        // 3. Prompt Gemini AI with STRICT JSON boundaries
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `You are an expert HR recruiter. Analyze the following raw text extracted from a candidate's resume and extract their profile details.
        
Resume Text:
${resumeText}

You MUST return the output as a valid, raw JSON object. Do not include markdown block ticks like \`\`\`json.
Extract these exactly matching keys:
{
  "bio": "Write a 2-3 sentence professional summary based on their experience.",
  "skills": "A comma separated list of their top 5-10 technical skills.",
  "college": "The name of their university or college.",
  "year": "Their graduation year (e.g. 2024). If not found, leave blank."
}`;

        const result = await model.generateContent(prompt);
        let responseText = result.response.text().trim();

        // Clean markdown JSON wrapper if hallucinated
        if (responseText.startsWith("\`\`\`json")) {
            responseText = responseText.replace(/^\`\`\`json/, "").replace(/\`\`\`$/, "").trim();
        } else if (responseText.startsWith("\`\`\`")) {
            responseText = responseText.replace(/^\`\`\`/, "").replace(/\`\`\`$/, "").trim();
        }

        // 4. Update the user
        let extractedData = JSON.parse(responseText);

        await User.findByIdAndUpdate(req.session.userId, {
            bio: extractedData.bio || "",
            skills: extractedData.skills || "",
            college: extractedData.college || "",
            year: extractedData.year || "",
            resumeText: resumeText // Saved for ATS pipeline
        });

        res.json({ message: "Resume parsed successfully ✅", data: extractedData });
    } catch (err) {
        console.error("RESUME PARSING ERROR:", err);
        res.status(500).json({ error: "Failed to parse resume with AI" });
    }
};

const scoreATSResume = async (req, res) => {
    try {
        const { jobDescription } = req.body;
        if (!jobDescription || jobDescription.trim().length < 50) {
            return res.status(400).json({ error: "Please provide a valid, detailed job description (min 50 chars)." });
        }

        const user = await User.findById(req.session.userId);
        if (!user || !user.resumeText) {
            return res.status(400).json({ error: "Upload your resume in the 'Manage Profile' section first!" });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `You are a strict Enterprise ATS (Applicant Tracking System). Compare this candidate's resume text firmly against the provided Job Description. Return exactly ONE JSON object (without markdown blocks) containing:
{
  "score": <number between 0 and 100 representing percentage match>,
  "missingKeywords": [<array of top 5 short, specific string keywords/technologies they lack>],
  "feedback": "<2-3 sentence strict, actionable feedback to improve their match rate>"
}

Target Job Description:
${jobDescription}

Candidate Resume Text:
${user.resumeText}`;

        const result = await model.generateContent(prompt);
        let responseText = result.response.text().trim();

        if (responseText.startsWith("\`\`\`json")) {
            responseText = responseText.replace(/^\`\`\`json/, "").replace(/\`\`\`$/, "").trim();
        } else if (responseText.startsWith("\`\`\`")) {
            responseText = responseText.replace(/^\`\`\`/, "").replace(/\`\`\`$/, "").trim();
        }

        const parsedData = JSON.parse(responseText);
        res.json(parsedData);
    } catch (err) {
        console.error("ATS LOGIC ERROR:", err);
        res.status(500).json({ error: "Failed to run ATS scanner pipeline." });
    }
};

const createReview = async (req, res) => {
    try {
        const { rating, comment } = req.body;
        if (!rating || !comment) {
            return res.status(400).json({ error: "All fields required" });
        }
        const user = await User.findById(req.session.userId);
        const review = new Review({
            userId: user._id,
            name: user.name,
            rating,
            comment
        });
        await review.save();
        res.json({ message: "Review submitted successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to submit review" });
    }
};

const getReviews = async (req, res) => {
    try {
        const reviews = await Review.find().sort({ createdAt: -1 });
        const avg = await Review.aggregate([
            {
                $group: {
                    _id: null,
                    averageRating: { $avg: "$rating" }
                }
            }
        ]);
        res.json({
            reviews,
            averageRating: avg[0]?.averageRating?.toFixed(1) || 0
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch reviews" });
    }
};

const getPerformanceSummary = async (req, res) => {
    try {
        const results = await MockTestResult.find({
            userId: req.session.userId
        });
        if (results.length === 0) {
            return res.json({
                totalTests: 0,
                averageScore: 0,
                bestScore: 0,
                lastScore: 0
            });
        }
        const totalTests = results.length;
        const totalScore = results.reduce((sum, r) => sum + r.score, 0);
        const averageScore = Math.round(totalScore / totalTests);
        const bestScore = Math.max(...results.map(r => r.score));
        const lastScore = results[results.length - 1].score;
        res.json({
            totalTests,
            averageScore,
            bestScore,
            lastScore
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch performance" });
    }
};

const getResultsData = async (req, res) => {
    try {
        const userId = req.session.userId;
        const mockTests = await MockTestResult.find({ userId }).sort({ createdAt: 1 });
        const evaluations = await EvaluationResult.find({ userId }).sort({ createdAt: 1 });

        res.json({ mockTests, evaluations });
    } catch (err) {
        console.error("RESULTS DATA ERROR:", err);
        res.status(500).json({ error: "Failed to fetch analytics data" });
    }
};

const exportPDFReport = async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);
        const evaluations = await EvaluationResult.find({ userId: req.session.userId })
            .sort({ createdAt: -1 })
            .limit(10); // Limit to last 10 to keep PDF concise

        const doc = new PDFDocument({ margin: 50 });

        // Setup raw streaming directly to the browser
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="${user.name.replace(/\s+/g, '_')}_AI_Report.pdf"`);

        doc.pipe(res);

        // Header Styling
        doc.fontSize(22).fillColor("#1e293b").text("Candidate Performance Report", { align: "center" });
        doc.moveDown(0.5);
        doc.fontSize(12).fillColor("#64748b").text(`Generated automatically by NextGen AI Platform on ${new Date().toLocaleDateString()}`, { align: "center" });
        doc.moveDown(2);

        // Candidate Context Panel
        doc.fontSize(16).fillColor("#0f172a").text("Candidate Details", { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(12).fillColor("#334155")
            .text(`Name: ${user.name}`)
            .text(`Email: ${user.email}`)
            .text(`College: ${user.college || "N/A"}`)
            .text(`Top Skills: ${user.skills || "N/A"}`);
        doc.moveDown(2);

        // Evaluations Parsing Section
        doc.fontSize(16).fillColor("#0f172a").text("Recent Technical & Behavioral Assessments", { underline: true });
        doc.moveDown(1);

        if (evaluations.length === 0) {
            doc.fontSize(12).fillColor("#475569").text("No assessments completed yet.");
        } else {
            evaluations.forEach((ev, idx) => {
                // Remove Markdown asterisks entirely for clean PDF plaintext output
                const cleanFeedback = ev.feedback.replace(/\*\*/g, "").replace(/\*/g, "").replace(/\`/g, "");

                let roundContext = 'Technical Interview';
                if (ev.type === 'behavioral') roundContext = 'Behavioral (STAR) Round';
                else if (ev.type === 'code') roundContext = 'Coding Analytics Test';

                doc.fontSize(14).fillColor("#2563eb").text(`Session ${idx + 1}: ${roundContext} - Score: ${ev.score}/10`);
                doc.fontSize(11).fillColor("#000000").text("Date: " + ev.createdAt.toLocaleDateString(), { continued: true }).text("");
                doc.moveDown(0.5);

                doc.fillColor("#333").font("Helvetica-Bold").text("Question Asked:");
                doc.font("Helvetica").text(ev.question);
                doc.moveDown(0.5);

                doc.fillColor("#333").font("Helvetica-Bold").text("Specific AI Coach Feedback:");
                doc.font("Helvetica").text(cleanFeedback);
                doc.moveDown(1.5);
            });
        }

        doc.end();

    } catch (err) {
        console.error("PDF GENERATION ERROR:", err);
        if (!res.headersSent) {
            res.status(500).json({ error: "Failed to generate PDF Report." });
        }
    }
};

const getLeaderboardData = async (req, res) => {
    try {
        const leaderboard = await EvaluationResult.aggregate([
            {
                $group: {
                    _id: "$userId",
                    totalExp: { $sum: "$score" },
                    totalInterviews: { $sum: 1 },
                    avgScore: { $avg: "$score" }
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "userDetails"
                }
            },
            {
                $unwind: "$userDetails"
            },
            {
                $project: {
                    _id: 1,
                    totalExp: 1,
                    totalInterviews: 1,
                    avgScore: { $round: ["$avgScore", 1] },
                    name: "$userDetails.name",
                    skills: "$userDetails.skills"
                }
            },
            {
                $sort: { totalExp: -1 }
            },
            {
                $limit: 50 // Keep top 50
            }
        ]);

        res.json({ leaderboard });
    } catch (err) {
        console.error("Leaderboard Aggregation Error:", err);
        res.status(500).json({ error: "Failed to load leaderboard." });
    }
};

const generateAIQuestion = async (req, res) => {
    try {
        const { field, branch, history, type, topic } = req.body || {};
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash"
        });

        let prompt = `You are an expert interviewer. Ask exactly ONE technical interview question for a candidate applying for the role of "${branch || 'Software Engineer'}" in the "${field || 'Technology'}" industry. Do not include introductory text, greetings, or formatting, just the question text.`;

        if (type === 'code') {
            const requestedTopic = topic || "Data Structures and Algorithms";
            prompt = `You are an expert technical AI interviewer. Provide exactly ONE ${requestedTopic} problem statement. Do not include greetings. Include the problem description, constraints, and an example. Format the exact problem text cleanly using Markdown.`;
        } else if (type === 'behavioral') {
            prompt = `You are a strict HR Executive recruiter. Ask exactly ONE behavioral / situational interview question for a "${branch || 'Software'}" candidate in the "${field || 'Technology'}" industry to assess their soft skills and character. The question should specifically require them to use the S.T.A.R. Method (Situation, Task, Action, Result). e.g. "Tell me about a time you had a conflict with a manager..." Do not include any greetings, just the raw question text.`;
        } else if (history && history.length > 0) {
            prompt += `\n\nHere is the interview history so far:\n`;
            history.forEach(item => {
                prompt += `Interviewer: ${item.question}\nCandidate: ${item.answer}\n`;
            });
            prompt += `\nBased on your previous question and the candidate's last answer, ask a relevant follow-up question to dig deeper into their knowledge OR move to a new topic if the current one is exhausted. Do not include introductory text, just the question text.`;
        }

        const result = await model.generateContent(prompt);
        const question = result.response.text();
        res.json({ question });
    } catch (error) {
        console.error("AI ERROR:", error);
        res.status(500).json({ error: "AI service error" });
    }
};

const liveFeedback = async (req, res) => {
    try {
        const { question, answer, image } = req.body;
        if (!question || !image) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `You are an expert technical interviewer. The candidate is answering this question: "${question}". They have currently spoken: "${answer}".
1. Analyze the candidate's body language and posture from the webcam snapshot provided.
2. Perform Speech Sentiment Analysis on the emotional tone, confidence, and clarity of their spoken text ("${answer}").
Provide ONE short, encouraging sentence of live feedback (max 15 words) addressing either their facial/posture cues or their speech sentiment/tone. Be natural and conversational (e.g. "Good eye contact and you sound confident, keep going!" or "Try to look at the camera and speak a bit slower.").`;

        const imagePart = {
            inlineData: {
                data: image.replace(/^data:image\/\w+;base64,/, ""),
                mimeType: "image/jpeg"
            }
        };

        const result = await model.generateContent([prompt, imagePart]);
        const feedback = result.response.text();
        res.json({ feedback });
    } catch (error) {
        console.error("LIVE FEEDBACK ERROR:", error);
        res.status(500).json({ error: "AI service error" });
    }
};

const evaluateAnswer = async (req, res) => {
    try {
        const { question, answer, type, language } = req.body;
        if (!question || !answer) {
            return res.status(400).json({ error: "Missing question or answer" });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        let prompt = `As an expert technical interviewer, evaluate the candidate's answer.
Question: ${question}
Candidate's Answer: ${answer}

Provide a concise, constructive evaluation covering:
1. Technical Accuracy
2. Completeness
3. Communication Skill

You MUST return the output as a valid, raw JSON object. Do not include markdown block ticks (like \`\`\`json). Just the raw JSON object.
Format:
{
  "evaluation": "Your markdown formatted feedback explaining the score.",
  "score": integer_out_of_10
}`;

        if (type === 'code') {
            prompt = `As an expert technical interviewer, evaluate the candidate's code submission.
Problem: ${question}
Candidate's Code (${language || 'programming language'}):
\`\`\`${language || ''}
${answer}
\`\`\`

Provide a professional evaluation covering:
1. Correctness
2. Time & Space Complexity
3. Code Cleanliness

You MUST return the output as a valid, raw JSON object. Do not include markdown block ticks (like \`\`\`json). Just the raw JSON object.
Format:
{
  "evaluation": "Your markdown formatted feedback explaining the score.",
  "score": integer_out_of_10
}`;
        } else if (type === 'behavioral') {
            prompt = `As a strict HR Executive recruiter, evaluate the candidate's behavioral interview answer.
Question: ${question}
Candidate's Answer: ${answer}

Aggressively grade the candidate strictly against the S.T.A.R. methodology (Situation, Task, Action, Result).
1. Did they describe the Situation clearly?
2. Did they explain their Action?
3. Was there a tangible Result?
4. How was their communication skill and character?

You MUST return the output as a valid, raw JSON object. Do not include markdown block ticks (like \`\`\`json). Just the raw JSON object.
Format:
{
  "evaluation": "Your markdown formatted feedback breaking down their S.T.A.R. method execution and explaining the score.",
  "score": integer_out_of_10
}`;
        }

        const result = await model.generateContent(prompt);
        let responseText = result.response.text().trim();

        // Sanitize JSON
        if (responseText.startsWith("\`\`\`json")) {
            responseText = responseText.replace(/^\`\`\`json/, "").replace(/\`\`\`$/, "").trim();
        } else if (responseText.startsWith("\`\`\`")) {
            responseText = responseText.replace(/^\`\`\`/, "").replace(/\`\`\`$/, "").trim();
        }

        let parsedData;
        try {
            parsedData = JSON.parse(responseText);
        } catch (e) {
            console.error("Parse formatting failure on evaluateAnswer! Full response:", responseText);

            // Fallback Regex Extraction if JSON fails
            const scoreMatch = responseText.match(/(\d+)\s*\/\s*10/);
            parsedData = {
                evaluation: responseText,
                score: scoreMatch ? parseInt(scoreMatch[1], 10) : 5 // Default score 5 if extraction completely fails
            };
        }

        // Save Evaluation silently
        let finalType = 'interview';
        if (type === 'code') finalType = 'code';
        if (type === 'behavioral') finalType = 'behavioral';

        const evaluationRecord = new EvaluationResult({
            userId: req.session.userId,
            type: finalType,
            question,
            answer,
            score: parsedData.score,
            feedback: parsedData.evaluation,
            language: language || null
        });
        await evaluationRecord.save();

        // Increment Gamification Streak
        await updateStreak(req.session.userId);

        res.json({ evaluation: parsedData.evaluation, score: parsedData.score });
    } catch (error) {
        console.error("EVALUATION ERROR:", error);
        res.status(500).json({ error: "AI service error" });
    }
};

const startMockTest = async (req, res) => {
    try {
        const { type, value } = req.body;

        if (type === "jd") {
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

            const prompt = `Based on the following Job Description (JD), act as an expert technical recruiter and generate exactly 10 multiple-choice questions testing the candidate on the required technical skills and technologies listed in the JD.

Job Description:
${value}

You MUST return the output as a valid, raw JSON array of objects. Do not include any intro, outro, or markdown formatting (like \`\`\`json). Just the JSON array.
Each object must exactly match this format:
{
  "question": "The question text here?",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": "Option B"
}`;

            const result = await model.generateContent(prompt);
            let responseText = result.response.text().trim();

            if (responseText.startsWith("\`\`\`json")) {
                responseText = responseText.replace(/^\`\`\`json/, "").replace(/\`\`\`$/, "").trim();
            } else if (responseText.startsWith("\`\`\`")) {
                responseText = responseText.replace(/^\`\`\`/, "").replace(/\`\`\`$/, "").trim();
            }

            let aiQuestions;
            try {
                aiQuestions = JSON.parse(responseText);
            } catch (e) {
                console.error("JSON Parse Error on JD Test:", responseText);
                return res.status(500).json({ error: "AI returned invalid format. Please try again." });
            }

            req.session.mockTest = {
                questions: aiQuestions,
                type,
                value: "Custom JD",
                startTime: Date.now()
            };
            return res.json({ questions: aiQuestions });
        }

        let matchQuery = { branch: "CSE" };
        if (type === "subject") {
            matchQuery.type = "subject";
            matchQuery.category = value;
        } else if (type === "company") {
            matchQuery.type = "company";
            matchQuery.category = value;
        } else {
            return res.status(400).json({ error: "Invalid mock test type" });
        }

        const questions = await Question.aggregate([
            { $match: matchQuery },
            { $sample: { size: 20 } }
        ]);

        if (!questions.length) {
            return res.status(404).json({ error: "No questions found" });
        }

        req.session.mockTest = {
            questions,
            type,
            value,
            startTime: Date.now()
        };
        res.json({ questions });
    } catch (error) {
        console.error("MOCK TEST START ERROR:", error);
        res.status(500).json({ error: "Failed to start mock test" });
    }
};

const submitMockTest = async (req, res) => {
    try {
        const { answers } = req.body;
        if (!req.session.mockTest || !req.session.mockTest.questions) {
            return res.status(400).json({ error: "Mock test not started" });
        }
        if (!Array.isArray(answers)) {
            return res.status(400).json({ error: "Invalid answers" });
        }
        const questions = req.session.mockTest.questions;
        let score = 0;

        questions.forEach((q, index) => {
            if (!answers[index] || !q.correctAnswer) return;
            const userAnswer = answers[index].trim().toLowerCase();
            const correct = q.correctAnswer.trim().toLowerCase();
            if (userAnswer === correct) {
                score++;
            }
        });

        const result = new MockTestResult({
            userId: req.session.userId,
            questions,
            answers,
            score
        });

        await result.save();

        // Increment Gamification Streak
        await updateStreak(req.session.userId);

        delete req.session.mockTest;

        res.json({
            message: "Mock test saved successfully",
            score,
            total: questions.length
        });
    } catch (err) {
        console.error("MOCK TEST SUBMIT ERROR:", err);
        res.status(500).json({ error: "Failed to save mock test" });
    }
};

module.exports = {
    getProfile,
    updateProfile,
    uploadProfilePhoto,
    uploadIntroVideo,
    createReview,
    getReviews,
    getPerformanceSummary,
    getResultsData,
    exportPDFReport,
    getLeaderboardData,
    generateAIQuestion,
    liveFeedback,
    evaluateAnswer,
    startMockTest,
    submitMockTest,
    uploadAndParseResume,
    scoreATSResume
};
