import express from "express";
const app = express();
import sessions from "express-session";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { URL } from "url";
import fs from "fs";
import path from "path";
import { Room } from "./room.js";
import { Player } from "./player.js";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Array to store all rooms
const rooms = [];
// Array to store all players
const players = [];

const firebaseConfig = {
    apiKey: "AIzaSyCegl1i1QmwiB4HjFL5a1rRPikZiHw48AI",
    authDomain: "yatzyprojekt-248e7.firebaseapp.com",
    projectId: "yatzyprojekt-248e7",
    storageBucket: "yatzyprojekt-248e7.appspot.com",
    messagingSenderId: "229545330983",
    appId: "1:229545330983:web:338b6e20baa2fbac820102",
    measurementId: "G-3YLENX4KZT",
};
// Initialize Firebase
const firestoreApp = initializeApp(firebaseConfig);
const database = getFirestore(firestoreApp);

app.use(
    sessions({
        secret: "yatzysecret2024",
        saveUninitialized: true,
        cookie: {
            sameSite: "none",
            secure: false,
            httpOnly: true,
            maxAge: 1000 * 60 * 60,
        }, // 24 hours
        resave: true,
    })
);

app.use(function (_req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept"
    );
    res.header(
        "Access-Control-Allow-Methods",
        "GET, PUT, POST, DELETE, OPTIONS"
    );
    next();
});
app.use(express.json());

/*
 * Load all routes from the routes folder
 * This will load all files in the routes folder and use them as routes.
 */
function loadRoutes(dir, routePrefix = "") {
    fs.readdirSync(dir, { withFileTypes: true }).forEach((file) => {
        const fullPath = path.join(dir, file.name);

        if (file.isDirectory()) {
            loadRoutes(fullPath, `${routePrefix}/${file.name}`);
        } else if (
            file.isFile() &&
            path.extname(file.name) === ".js" &&
            file.name !== "index.js"
        ) {
            let routerPath = `${routePrefix}/${path.basename(
                file.name,
                ".js"
            )}`;

            const moduleURL = new URL("file://" + fullPath.replace(/\\/g, "/")); // a fix since its not a es module
            import(moduleURL)
                .then((route) => {
                    // if file is named index.js then its a root route
                    if (routerPath === "") {
                        routerPath = "/";
                    }
                    app.use(routerPath, route.default);
                })
                .catch((error) => {
                    console.error(
                        `Error importing module '${fullPath}':`,
                        error
                    );
                });
        } else if (file.isFile() && file.name === "index.js") {
            const moduleURL = new URL("file://" + fullPath.replace(/\\/g, "/"));

            import(moduleURL)
                .then((route) => {
                    app.use(routePrefix, route.default);
                })
                .catch((error) => {
                    console.error(
                        `Error importing module '${fullPath}':`,
                        error
                    );
                });
        }
    });
}

loadRoutes(path.join(__dirname, "routes"));

const playerCollection = collection(database, "players");
const roomCollection = collection(database, "rooms");

const getPlayers = async () => {
    const playerSnapshot = await getDocs(playerCollection);
    const playerList = playerSnapshot.docs.map((doc) => doc.data());
    return playerList;
};
const getRooms = async () => {
    const roomSnapshot = await getDocs(roomCollection);
    const roomList = roomSnapshot.docs.map((doc) => doc.data());
    return roomList;
};

getPlayers().then((playerList) => {
    playerList.forEach((player) => {
        const cPlayer = Player.fromMap(player);
        players.push(cPlayer);
    });
});
getRooms().then((roomList) => {
    roomList.forEach((room) => {
        const cRoom = Room.fromMap(room, players);
        rooms.push(cRoom);
    });
});

app.listen(8000, () => console.log("running"));

// export data to be used in routes
export { rooms, players, roomCollection, playerCollection };
