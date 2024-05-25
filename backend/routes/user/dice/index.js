import express from "express";
const router = express.Router();
import { rooms, roomCollection, playerCollection } from "../../../index.js";
import { getDocs, query, where, updateDoc } from "firebase/firestore";
import { YatzyDice } from "../../../YatzyDice.js";

router.get("/", (req, res) => {
    const sessionID = req.query?.sessionID;
    if (sessionID === undefined || sessionID === "") {
        res.status(400).send({ message: "Session ID missing" });
        return;
    }
    const roomID = req.query?.roomID;
    if (roomID === undefined || roomID === "") {
        res.status(400).send({ message: "Room ID missing" });
        return;
    }
    const room = rooms.find((room) => room.getId() === roomID);
    if (room === undefined) {
        res.status(404).send({ message: "Room not found" });
        return;
    }
    const player = room.getPlayerBySessionID(sessionID);
    if (player === undefined) {
        res.status(404).send({ message: "Player not found" });
        return;
    }
    const dice = player.getYatzyDice();
    if (dice === undefined || dice === null) {
        res.status(404).send({ message: "Dice not found" });
        return;
    }
    res.send({
        success: true,
        dice: player.getYatzyDice().toMap(),
    });
});

router.post("/:action", (req, res) => {
    const sessionID = req.body?.sessionID;
    if (sessionID === undefined || sessionID === "") {
        res.status(400).send({ message: "Session ID missing" });
        return;
    }
    const room = rooms.find((room) => room.getId() === req.body.roomID);
    if (room === undefined) {
        res.status(404).send({ message: "Room not found" });
        return;
    }
    if (room.getStatus() !== "STARTED") {
        res.status(403).send({ message: "Room not started" });
        return;
    }
    const player = room.getPlayerBySessionID(sessionID);
    if (player === undefined) {
        res.status(404).send({ message: "Player not found" });
        return;
    }

    const dice = player.getYatzyDice();
    const action = req.params.action;
    if (action === "roll") {
        if (dice.getThrowCount() >= 3) {
            res.status(400).send({ message: "Maximum throw count reached" });
            return;
        }
        const locked = req.body?.locked;
        if (locked === undefined) {
            res.status(400).send({ message: "Locked missing" });
            return;
        }
        for (let i = 0; i < locked.length; i++) {
            if (typeof locked[i] !== "boolean") {
                res.status(400).send({ message: "Invalid locked" });
                return;
            }
        }
        for (let i = 0; i < locked.length; i++) {
            if (locked[i] === true) {
                dice.lockDie(i);
            } else {
                dice.unlockDie(i);
            }
        }
        dice.throw();
        const playerQuery = query(
            playerCollection,
            where("name", "==", player.getName())
        );
        getDocs(playerQuery).then((querySnapshot) => {
            querySnapshot.docs.forEach((doc) => {
                updateDoc(doc.ref, {
                    yatzyDice: dice.toMap(),
                });
            });
        });
        res.send({
            success: true,
            dice: dice.toMap(),
        });
    } else if (action === "score") {
        const index = req.body?.field;
        if (index === undefined) {
            res.status(400).send({ message: "Index missing" });
            return;
        } else if (
            typeof index !== "number" ||
            index < 0 ||
            index > dice.getResults().length
        ) {
            res.status(400).send({ message: "Invalid index" });
            return;
        }
        const score = dice.chooseField(index);
        if (score === false) {
            res.status(400).send({
                message: "Field already taken",
            });
        } else {
            dice.resetThrowCount();
            if (player.isFinished()) {
                let done = true;
                for (let i = 0; i < room.getPlayers().length; i++) {
                    if (!room.getPlayers()[i].isFinished()) {
                        done = false;
                    }
                }
                if (done && room.getPlayers().length > 0) {
                    room.setStatus("FINISHED");
                    const roomQuery = query(
                        roomCollection,
                        where("id", "==", room.getId())
                    );
                    getDocs(roomQuery).then((querySnapshot) => {
                        querySnapshot.docs.forEach((doc) => {
                            updateDoc(doc.ref, {
                                status: "FINISHED",
                            });
                        });
                    });

                    //calculate winner and update player stats
                    const winnerPlayer = room
                        .getPlayers()
                        .reduce((prev, current) =>
                            prev.getScore() > current.getScore()
                                ? prev
                                : current
                        );
                    for (let i = 0; i < room.getPlayers().length; i++) {
                        const player = room.getPlayers()[i];
                        player.addOldYatzyDice();
                        player.setYatzyDice(null);
                        const playerQuery = query(
                            playerCollection,
                            where("name", "==", player.getName())
                        );
                        getDocs(playerQuery).then((querySnapshot) => {
                            const obj =
                                winnerPlayer === player
                                    ? { wins: player.getWins() + 1 }
                                    : { losses: player.getLosses() + 1 };
                            obj.yatzyDice = null;
                            obj.oldYatzyDice = player
                                .getOldYatzyDice()
                                .map((yatzyDice) => {
                                    const obj = yatzyDice.toMap();
                                    obj.roomID = room.getId();
                                    return obj;
                                });
                            querySnapshot.docs.forEach((doc) => {
                                updateDoc(doc.ref, obj);
                            });
                        });
                    }
                    res.send({
                        success: true,
                        dice: dice.toMap(),
                    });
                    return;
                }
            }
            const playerQuery = query(
                playerCollection,
                where("name", "==", player.getName())
            );
            getDocs(playerQuery).then((querySnapshot) => {
                querySnapshot.docs.forEach((doc) => {
                    updateDoc(doc.ref, {
                        yatzyDice: dice.toMap(),
                    });
                });
            });
            res.send({
                success: true,
                dice: dice.toMap(),
            });
        }
    }
});
export default router;
