require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const MongoStore = require("connect-mongo").default; // .default required for CommonJS module compatibility

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const apiRoutes = require("./routes/apiRoutes");
const viewRoutes = require("./routes/viewRoutes");
const { checkLogin } = require("./middleware/auth");

console.log("Server file started");

const app = express();

const fs = require('fs');
// Ensure upload directories exist (Critical for Render/Cloud deployments)
const uploadDirs = ['uploads', 'public/uploads/profile', 'public/uploads/videos'];
uploadDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

app.use(session({
    secret: process.env.SESSION_SECRET || "fallback_secret",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/loginDB",
        collectionName: "sessions"
    }),
    cookie: {
        secure: false,        // true only for HTTPS
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 // 1 day session
    }
}));

// MongoDB connection
connectDB();

// Routes
app.use("/", authRoutes);
app.use("/api", apiRoutes);
app.use("/", viewRoutes);

// Global Error Handler Middleware
app.use((err, req, res, next) => {
    console.error("Global Error Caught:", err.message || err);
    res.status(err.status || 500).json({
        error: "Internal Server Error",
        message: err.message || "Something went wrong on the server."
    });
});

// START SERVER
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
