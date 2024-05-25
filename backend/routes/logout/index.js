import express from "express";
const router = express.Router();
import { players } from "../../index.js";

router.post("/", (req, res) => {
    const { sessionID } = req.body;

    if (sessionID === undefined || sessionID === "") {
        res.status(400).send({ message: "Session ID missing" });
        return;
    }

    const player = players.find((player) => player.getSession() === sessionID);
    // player should exists
    if (player === undefined) {
        res.status(403).json({ message: "Player not found" });
        return;
    }

    player.setSession(null);
    res.send({
        message: "Logged out",
        success: true,
    });
});

export default router;
