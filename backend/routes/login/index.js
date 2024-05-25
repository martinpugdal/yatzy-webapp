import express from "express";
const router = express.Router();
import { players } from "../../index.js";
import { randomBytes } from "crypto";
import { Player } from "../../player.js";

router.post("/", (req, res) => {
    const { username, password, sessionID } = req.body;

    if (username === undefined) {
        res.status(403).json({ message: "Username not provided" });
        return;
    }
    if (username === "") {
        res.status(403).json({ message: "Username cannot be empty" });
        return;
    }
    if (password === undefined) {
        res.status(403).json({ message: "Password not provided" });
        return;
    }
    if (password === "") {
        res.status(403).json({ message: "Password cannot be empty" });
        return;
    }
    // already have an account
    if (sessionID !== undefined && sessionID !== "") {
        res.status(403).json({
            message: "Already logged in with this sessionID",
        });
        return;
    }

    const player = players.find(
        (player) => player.getName().toLowerCase() === username.toLowerCase()
    );
    // player should exists
    if (player === undefined) {
        res.status(403).json({ message: "Player not found" });
        return;
    }

    if (Player.hashPassword(password) !== player.getPassword()) {
        res.status(403).json({ message: "Wrong password" });
        return;
    }

    // create new player
    const generatedID = randomBytes(20).toString("hex");
    player.setSession(generatedID);
    res.send({
        message: "Login successful",
        sessionID: generatedID,
        success: true,
    });
});

export default router;
