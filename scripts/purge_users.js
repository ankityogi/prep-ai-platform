require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");

const purgeUsers = async () => {
    try {
        const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/loginDB";
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB");

        const result = await User.deleteMany({});
        console.log(`Successfully purged ${result.deletedCount} users from the database.`);

    } catch (err) {
        console.error("Error purging users:", err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

purgeUsers();
