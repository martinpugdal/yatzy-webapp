import express from "express";
const router = express.Router();
import { players, rooms } from "../../../index.js";

router.get("/:username", (req, res) => {
    const username = req.params.username;
    const playerExists = players.some(
        (player) => player.getName().toLowerCase() === username.toLowerCase()
    );
    if (!playerExists) {
        res.status(404).json({ message: "Player not found" });
        return;
    }

    const player = players.find(
        (player) => player.getName().toLowerCase() === username.toLowerCase()
    );
    const room = rooms.find(
        (room) => room.getPlayerBySessionID(player.getSession()) !== undefined
    );

    const playerMap = player.toMap();
    const oldYatzyDice = player.getOldYatzyDice().map((yatzyDice) => {
        return {
            yatzyDice: yatzyDice.toMap(),
        };
    });

    playerMap.played = oldYatzyDice.length;
    playerMap.won = player.getWins();
    playerMap.lost = player.getLosses();
    playerMap.gotYatzy =
        player
            .getOldYatzyDice()
            .filter((yatzyDice) => yatzyDice.getResults().slice(-1)[0] !== 0)
            .length || 0;
    playerMap.highScore = player.getHighScore() || 0;
    playerMap.averageScore = playerMap.highScore / oldYatzyDice.length || 0;
    res.send({
        player: playerMap,
        room: room?.toMap(),
        success: true,
    });
});

export default router;
