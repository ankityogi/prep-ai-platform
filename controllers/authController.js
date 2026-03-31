const bcrypt = require("bcrypt");
const User = require("../models/User");

const register = async (req, res) => {
    try {
        let { name, email, password } = req.body;

        name = name ? name.trim() : "";
        email = email ? email.trim().toLowerCase() : "";

        if (!name || !email || !password) {
            return res.redirect("/register?error=empty");
        }
        if (password.length < 6) {
            return res.redirect("/register?error=length");
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.redirect("/register?error=exists");
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            name,
            email,
            password: hashedPassword
        });

        await user.save();
        console.log("User saved:", email);
        res.redirect("/");

    } catch (err) {
        console.error(err);
        res.status(500).send("Registration error");
    }
};

const login = async (req, res) => {
    try {
        let { email, password } = req.body;

        email = email ? email.trim().toLowerCase() : "";

        if (!email || !password) {
            return res.redirect("/?error=empty");
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.redirect("/?error=1");
        }

        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            return res.redirect("/?error=1");
        }

        req.session.userId = user._id;
        res.redirect("/dashboard");

    } catch (err) {
        console.error(err);
        res.status(500).send("Login error");
    }
};

const logout = (req, res) => {
    req.session.destroy(() => {
        res.redirect("/");
    });
};

module.exports = {
    register,
    login,
    logout
};
