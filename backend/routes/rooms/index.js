import express from "express";
const router = express.Router();
import {
    rooms,
    players,
    roomCollection,
    playerCollection,
} from "../../index.js";
import { getDocs, query, where, updateDoc } from "firebase/firestore";

router.get("/", (req, res) => {
    const objekt = {};
    const roomsMapped = rooms.map((room) => {
        return room.toMap();
    });
    const playersMapped = players.map((player) => {
        return player.toMap();
    });
    const sessionID = req.query?.sessionID;
    if (sessionID !== undefined && sessionID !== "") {
        const room = rooms.find(
            (room) => room.getPlayerBySessionID(sessionID) !== undefined
        );
        if (room !== undefined) {
            objekt.currentRoom = room.toMap();
            objekt.player = room.getPlayerBySessionID(sessionID).toMap();
        }
    }
    objekt.rooms = roomsMapped;
    objekt.players = playersMapped;
    res.send(objekt);
});

router.get("/:room", (req, res) => {
    const roomID = req.params.room;
    let resValues = {};
    const room = rooms.find((room) => room.id === roomID);
    if (room === undefined) {
        resValues = { message: "Room not found" };
        res.status(404).send(resValues);
        return;
    }
    const playerList = room.getPlayers();
    const playerValues = playerList.map((player) => {
        const roomScore =
            room.getStatus() === "FINISHED"
                ? player
                      .getOldYatzyDice()
                      .find(
                          (yatzyDice) => yatzyDice.getRoomID() === room.getId()
                      )
                      ?.getResults()
                      .reduce((a, b) => a + b, 0)
                : player.getScore();
        return {
            name: player.getName(),
            finished:
                room.getStatus() === "FINISHED" ? true : player.isFinished(),
            score: roomScore,
        };
    });
    resValues = {
        id: room.getId(),
        players: playerValues,
        maxPlayers: room.getMaxPlayers(),
        status: room.getStatus(),
    };
    const sessionID = req.query?.sessionID;
    if (sessionID !== undefined && sessionID !== "") {
        const player = room.getPlayerBySessionID(sessionID);
        if (player !== undefined) {
            resValues.player = player.toMap();
        }
    }
    res.send(resValues);
});

router.post("/:room/:action", (req, res) => {
    const sessionID = req.body?.sessionID;
    if (sessionID === undefined || sessionID === "") {
        res.status(400).send({ message: "Session ID missing" });
        return;
    }
    const roomID = req.params.room;
    const room = rooms.find((room) => room.getId() === roomID);
    if (room === undefined) {
        res.status(404).send({ message: "Room not found" });
        return;
    }

    const actionsAllowedWithoutPlayer = ["joinRoom"];

    const player = actionsAllowedWithoutPlayer.includes(req.params.action)
        ? players.find((player) => player.getSession() === sessionID)
        : room.getPlayerBySessionID(sessionID);
    if (player === undefined) {
        res.status(404).send({ message: "Player not found" });
        return;
    }

    const action = req.params.action;
    if (action === "joinRoom") {
        const playerRoom = rooms.find(
            (room) =>
                room.getPlayerBySessionID(sessionID) !== undefined &&
                room.getStatus() !== "FINISHED"
        );
        if (playerRoom !== undefined) {
            res.status(403).send({ message: "Player already joined a room" });
        } else if (room.getStatus() !== "WAITING") {
            res.status(403).send({ message: "Room not waiting" });
        } else if (room.getPlayers().length >= room.getMaxPlayers()) {
            res.status(403).send({ message: "Room full" });
        } else {
            room.addPlayer(player);
            const roomQuery = query(
                roomCollection,
                where("id", "==", room.getId())
            );
            getDocs(roomQuery).then((querySnapshot) => {
                querySnapshot.docs.forEach((doc) => {
                    updateDoc(doc.ref, {
                        players: room.players.map((player) => player.getName()),
                    });
                });
            });
            res.status(200).send({
                message: "Player joined room",
                success: true,
            });
        }
    } else if (action === "leaveRoom") {
        if (room.getStatus() !== "WAITING") {
            res.status(403).send({ message: "Room not waiting" });
        } else {
            room.removePlayer(player);
            const roomQuery = query(
                roomCollection,
                where("id", "==", room.getId())
            );
            getDocs(roomQuery).then((querySnapshot) => {
                querySnapshot.docs.forEach((doc) => {
                    updateDoc(doc.ref, {
                        players: room.players.map((player) => player.getName()),
                    });
                });
            });
            res.status(200).send({
                message: "Player left room",
                success: true,
            });
        }
    } else if (action === "start") {
        if (room.getStatus() !== "WAITING") {
            res.status(403).send({ message: "Room not waiting" });
            return;
        }
        room.setStatus("STARTED");
        for (const player of room.getPlayers()) {
            if (
                player.getYatzyDice() === undefined ||
                player.getYatzyDice() === null
            ) {
                player.resetYatzyDice();
            }
            player.getYatzyDice().setRoomID(room.getId());
            const playerQuery = query(
                playerCollection,
                where("name", "==", player.getName())
            );
            getDocs(playerQuery).then((querySnapshot) => {
                const obj = player.getYatzyDice().toMap();
                obj.roomID = room.getId();
                querySnapshot.docs.forEach((doc) => {
                    updateDoc(doc.ref, {
                        yatzyDice: obj,
                    });
                });
            });
        }
        const roomQuery = query(
            roomCollection,
            where("id", "==", room.getId())
        );
        getDocs(roomQuery).then((querySnapshot) => {
            querySnapshot.docs.forEach((doc) => {
                updateDoc(doc.ref, {
                    status: "STARTED",
                });
            });
        });
        res.status(200).send({ message: "Game started", success: true });
    } else if (action === "validate") {
        res.send({ message: "All good", success: true });
    }
});

export default router;
