const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userModel = require("../models/user.model");

const setAuthCookie = (res, token) => {
    res.cookie("token", token, {
        httpOnly: true,

        // HTTPS is required for production cross-site cookies
        secure: process.env.NODE_ENV === "production",

        // Local: lax
        // Production: allows Render frontend -> Render backend cookie
        sameSite:
            process.env.NODE_ENV === "production"
                ? "none"
                : "lax",

        maxAge: 60 * 60 * 1000, // 1 hour
    });
};


async function register(req, res) {
    try {
        const {
            fullName = {},
            email,
            password
        } = req.body;

        const { firstName, lastName } = fullName;

        if (!firstName || !password || !email) {
            return res.status(422).json({
                msg: "some fields are missing"
            });
        }

        const user = await userModel.findOne({
            email
        });

        if (user) {
            return res.status(422).json({
                msg: "user already exists"
            });
        }

        const hash = await bcrypt.hash(password, 10);

        const newUser = await userModel.create({
            email,
            fullName: {
                firstName,
                lastName
            },
            password: hash
        });

        const token = jwt.sign(
            {
                id: newUser._id
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1h"
            }
        );

        setAuthCookie(res, token);

        return res.status(201).json({
            msg: "user created successfully",
            user: {
                id: newUser._id,
                email: newUser.email,
                fullName: newUser.fullName
            }
        });

    } catch (error) {
        console.error("Register error:", error);

        return res.status(500).json({
            msg: "internal server error"
        });
    }
}


async function login(req, res) {
    try {
        const {
            email,
            password
        } = req.body;

        if (!password || !email) {
            return res.status(422).json({
                msg: "some fields are missing"
            });
        }

        const user = await userModel.findOne({
            email
        });

        if (!user) {
            return res.status(422).json({
                msg: "user not registered"
            });
        }

        const isPasswordVerify = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordVerify) {
            return res.status(401).json({
                msg: "password not matched"
            });
        }

        const token = jwt.sign(
            {
                id: user._id
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1h"
            }
        );

        setAuthCookie(res, token);

        return res.status(200).json({
            msg: "login successfully",
            user: {
                id: user._id,
                email: user.email,
                fullName: user.fullName
            }
        });

    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            msg: "internal server error"
        });
    }
}


module.exports = {
    register,
    login
};