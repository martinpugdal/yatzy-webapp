import express from "express";
const router = express.Router();
import { players, rooms, roomCollection } from "../../index.js";
import { Room } from "../../room.js";
import { addDoc } from "firebase/firestore";

router.post("/", (req, res) => {
    const sessionID = req.body?.sessionID;
    if (sessionID === undefined || sessionID === "") {
        res.status(400).send({ message: "Session ID missing" });
        return;
    }
    const player = players.find((player) => player.getSession() === sessionID);
    if (player === undefined) {
        res.status(404).send({ message: "Player not found" });
        return;
    }
    if (
        rooms.some(
            (room) =>
                room.getPlayers().includes(player) &&
                room.getStatus() !== "FINISHED"
        )
    ) {
        res.status(403).send({ message: "Player already in a room" });
        return;
    }

    const room = createRoom();
    if (room === null) {
        res.status(400).send({ message: "Max waiting rooms reached" });
    } else {
        rooms.push(room);
        room.addPlayer(player);
        addDoc(roomCollection, {
            id: room.getId(),
            players: room.getPlayers().map((player) => player.getName()),
            maxPlayers: room.getMaxPlayers(),
            status: room.getStatus(),
        });
        res.send({ message: "Success", roomID: room.getId(), success: true });
    }
});

function createRoom() {
    // if there is 5 rooms where the status is not started, then dont create a new room
    if (rooms.filter((room) => room.getStatus() === "WAITING").length >= 5) {
        return null;
    }
    // id should be unique, so we need to find the highest id and add 1
    if (rooms.length === 0) {
        const room = new Room("0");
        return room;
    } else {
        const newID = rooms
            .reduce((prev, current) =>
                prev.getId() > current.getId() ? prev : current
            )
            .getId();
        return new Room(`${parseInt(newID) + 1}`);
    }
}

export default router;
