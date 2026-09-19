const jwt = require("jsonwebtoken");
const userModel = require("../models/user.model");

async function authentication(req, res, next) {
    try {
        const { token } = req.cookies;

        if (!token) {
            return res.status(401).json({
                msg: "user not logged in"
            });
        }

        const decode = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        const user = await userModel
            .findById(decode.id)
            .select("-password");

        if (!user) {
            return res.status(401).json({
                msg: "user unauthorized"
            });
        }

        req.user = user;

        next();

    } catch (err) {
        console.error("Authentication error:", err.message);

        return res.status(401).json({
            msg: "user unauthorized"
        });
    }
}

module.exports = authentication;