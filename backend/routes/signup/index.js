import express from "express";
const router = express.Router();
import { players, playerCollection } from "../../index.js";
import { Player } from "../../player.js";
import { randomBytes } from "crypto";
import { addDoc } from "firebase/firestore";

router.post("/", (req, res) => {
    const { username, password } = req.body;

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

    // one username globally
    const playerExists = players.some(
        (player) => player.getName().toLowerCase() === username.toLowerCase()
    );
    if (playerExists === true) {
        res.status(403).json({ message: "Username already taken" });
        return;
    }

    // create new player
    const generatedID = randomBytes(20).toString("hex");
    const newPlayer = new Player(username, generatedID);
    newPlayer.setPassword(password);
    players.push(newPlayer);
    addDoc(playerCollection, {
        name: username,
        password: newPlayer.getPassword(),
    });
    res.send({
        message: "Signup successful",
        sessionID: generatedID,
        success: true,
    });
});

export default router;
