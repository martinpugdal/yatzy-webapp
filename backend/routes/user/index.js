import express from "express";
const router = express.Router();
import { rooms, players } from "../../index.js";

router.get("/", (req, res) => {
    const sessionID = req.query.sessionID;
    const roomID = req.query.roomID;
    if (sessionID === undefined) {
        res.status(403).json({ message: "SessionID not provided" });
        return;
    }

    const player = players.find((player) => player.getSession() === sessionID);
    if (player === undefined) {
        res.status(403).json({ message: "Player not found" });
        return;
    }

    const room =
        roomID !== undefined
            ? rooms.find(
                  (room) =>
                      room.getId() === roomID && room.getStatus() !== "FINISHED"
              )
            : rooms.find(
                  (room) =>
                      room.getPlayerBySessionID(sessionID) !== undefined &&
                      room.getStatus() !== "FINISHED"
              );
    if (
        roomID !== undefined &&
        (room === undefined || room.getId() !== roomID)
    ) {
        res.status(404).json({ message: "Room not found" });
        return;
    }

    res.status(200).json({
        room: room?.toMap(),
        player: player?.toMap(),
        success: true,
    });
});

export default router;
