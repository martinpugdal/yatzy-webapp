import { get, getAPIURL, post } from "./httpsUtil.js";

// initialize important variables
const sessionID = new URLSearchParams(window.location.search).get("sessionID");
const roomID = window.location.pathname.split("/")[2];

let diceData = get(getAPIURL() + "/user/dice?roomID=" + roomID, sessionID).then(
    (values) => {
        return values;
    }
);

// initialize dice and other variables
let dices = document.querySelector("#dices").children;
let scoreTable = [
    ...document.querySelector(".scores").querySelectorAll("td"),
].filter(
    (td) =>
        td.classList.contains("score-field") &&
        !td.id.includes("total") &&
        !td.id.includes("bonus") &&
        !td.id.includes("sum")
);
let totalTable = [
    ...document.querySelector(".scores").querySelectorAll("td"),
].filter(
    (td) =>
        td.classList.contains("score-field") &&
        (td.id.includes("total") ||
            td.id.includes("bonus") ||
            td.id.includes("sum"))
);

function setupDice() {
    for (let i = 0; i < diceData.values.length; i++) {
        if (diceData.values[i] === 0) {
            dices[i].setAttribute("src", `/static/img/Unknown.png`);
            dices[i].classList.remove("locked");
            dices[i].style.animation = "none";
        } else {
            const diceValue = diceData.values[i];
            dices[i].setAttribute("src", `/static/img/Dice-${diceValue}.png`);
            const locked = diceData.locked[i];
            if (locked === true && diceData.throwCount !== 0) {
                dices[i].classList.add("locked");
                dices[i].style.animation =
                    "shake 0.5s linear 0s infinite alternate";
            } else {
                dices[i].classList.remove("locked");
                dices[i].style.animation = "none";
            }
        }
    }
}

function diceIsLocked(diceNumber) {
    return dices[diceNumber].classList.contains("locked");
}

// update turn counter
function updateTurnCounter() {
    if (diceData.throwCount === 3) {
        document.querySelector("#rolls-left").textContent =
            "No more rolls left";
    } else if (diceData.throwCount === 0) {
        document.querySelector("#rolls-left").textContent = "";
    } else {
        document.querySelector("#rolls-left").textContent =
            "Turn " + diceData.throwCount;
    }
}

function setupScoreTable() {
    for (let i = 0; i < diceData.results.length; i++) {
        if (diceData.results[i] === -1) {
            scoreTable[i].textContent = "";
        } else {
            scoreTable[i].textContent = diceData.results[i];
            scoreTable[i].classList.add("locked");
        }
    }
}

function updateScoreTable() {
    scoreTable.forEach((scoreField, index) => {
        if (diceData.results[index] === -1) {
            if (diceData.throwCount === 0) {
                scoreField.textContent = "";
            } else {
                scoreField.textContent = diceData.combinations[index];
            }
        } else {
            scoreField.textContent = diceData.results[index];
        }
    });
    if (diceData.sum !== 0) {
        totalTable[0].textContent = diceData.sum;
    }
    if (diceData.bonusGranted === true) {
        totalTable[1].textContent = diceData.bonus;
    }
    if (diceData.total !== 0) {
        totalTable[2].textContent = diceData.total;
    }
}

// check if all fields are filled
function allFieldsIsFilled() {
    return diceData.results.every((result) => result !== -1);
}

// roll dice
async function roll() {
    if (diceData.throwCount === 3) {
        return;
    }
    const rollButton = document.querySelector("#roll");
    if (rollButton.textContent != "Roll!") {
        return;
    }
    const lockedDices = [false, false, false, false, false];
    for (let i = 0; i < dices.length; i++) {
        lockedDices[i] = diceIsLocked(i);
    }
    const obj = {
        locked: lockedDices,
        roomID: roomID,
    };
    const res = await post(getAPIURL() + "/user/dice/roll", obj, sessionID);
    if (res.success === true) {
        diceData = res.dice;
    } else {
        alert("Something went wrong!");
        location.reload();
    }
    rollButton.textContent = "Rolling...";
    updateTurnCounter();
    var lastDice = 0;
    for (let i = 0; i < dices.length; i++) {
        if (diceData.locked[i] === true) {
            continue;
        }
        lastDice = i;
        dices[i].style.animation = "roll 12ms linear 0s infinite alternate";
        setTimeout(function () {
            let diceValue = diceData.values[i];
            dices[i].setAttribute("src", `/static/img/Dice-${diceValue}.png`);
            dices[i].style.animation = "none";
        }, (i + 1) * 120);
    }
    setTimeout(function () {
        if (diceData.throwCount === 3) {
            rollButton.textContent = "All rolls used!";
        } else {
            rollButton.textContent = "Roll!";
        }
        updateScoreTable();
    }, (lastDice + 1) * 120);
}

// lock dice
function lockDice(diceNumber) {
    if (diceData.locked[diceNumber] === true) {
        diceData.locked[diceNumber] = false;
        dices[diceNumber].style.animation = "none";
        dices[diceNumber].classList.remove("locked");
    } else {
        diceData.locked[diceNumber] = true;
        dices[diceNumber].style.animation =
            "shake 0.5s linear 0s infinite alternate";
        dices[diceNumber].classList.add("locked");
    }
}

// scorefield click, data update and game reset check
async function scoreTableClick(scoreFieldIndex) {
    if (diceData.results[scoreFieldIndex] !== -1) {
        return;
    }
    let score = diceData.combinations[scoreFieldIndex];
    const rollButton = document.querySelector("#roll");
    rollButton.textContent = "Roll!";
    scoreTable[scoreFieldIndex].textContent = score;
    scoreTable[scoreFieldIndex].classList.add("locked");
    const res = await post(
        getAPIURL() + "/user/dice/score",
        { field: scoreFieldIndex, roomID: roomID },
        sessionID
    );
    console.log(res);
    if (res.success === true) {
        diceData = res.dice;
        setupDice();
    } else {
        alert(res.message);
        location.reload();
    }
    updateScoreTable();
    if (allFieldsIsFilled()) {
        const loc = location.href;
        location.href = loc.substring(0, loc.indexOf("/game"));
    }
}

function setupGame() {
    get(
        getAPIURL() + (roomID !== null ? "/user?roomID=" + roomID : "/user/"),
        sessionID
    ).then((values) => {
        if (values.success === true) {
            const room = values.room;
            const player = values.player;
            document.getElementById("room-id").textContent = room.id;
            document.getElementById("player-name").textContent = player.name;
            const playerList = document.getElementById("players");
            playerList.textContent = "";
            for (let i = 0; i < room.players.length; i++) {
                const player = room.players[i];
                const li = document.createElement("li");
                li.textContent =
                    player.name +
                    " - " +
                    player.score +
                    " points" +
                    " - " +
                    (player.finished === true ? "😎👌" : "🎲");
                playerList.appendChild(li);
            }
            setupDice();
            setupScoreTable();
            updateScoreTable();
            updateTurnCounter();
        }
    });
}

function fetchGame() {
    get(getAPIURL() + "/user/dice?roomID=" + roomID, sessionID).then(
        (values) => {
            diceData = values.dice;
            setupGame();
        }
    );
}

function setupListeners() {
    // dice listeners
    for (let i = 0; i < dices.length; i++) {
        dices[i].addEventListener("click", function () {
            if (diceData.throwCount === 0) {
                return;
            }
            lockDice(i);
        });
    }

    // score field listeners
    for (let i = 0; i < scoreTable.length; i++) {
        scoreTable[i].addEventListener("click", async function () {
            if (diceData.throwCount === 0) {
                return;
            }
            await scoreTableClick(i);
        });
    }

    // roll button listener
    document
        .querySelector("#roll")
        .addEventListener("click", async function () {
            await roll();
        });

    document
        .getElementById("leave-room")
        .addEventListener("click", function () {
            location.href = location.href.substring(
                0,
                location.href.indexOf("/game")
            );
        });
}

setupListeners();
fetchGame();
