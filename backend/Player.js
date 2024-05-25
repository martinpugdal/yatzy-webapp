import { YatzyDice } from "./YatzyDice.js";
import { createHash } from "crypto";

export class Player {
    constructor(name, session) {
        this.session = session;
        this.name = name;
        this.password = null;
        this.yatzyDice = null;
        this.oldYatzyDice = [];
        this.wins = 0;
        this.losses = 0;
    }

    getWins() {
        return this.wins;
    }

    getLosses() {
        return this.losses;
    }

    getPassword() {
        return this.password;
    }

    setPassword(password) {
        this.password = Player.hashPassword(password);
    }

    static hashPassword(password) {
        const hash = createHash("sha256");
        return hash.update(password).digest("hex");
    }

    login(password) {
        return password === this.password;
    }

    getName() {
        return this.name;
    }

    getSession() {
        return this.session;
    }

    setSession(session) {
        this.session = session;
    }

    getYatzyDice() {
        return this.yatzyDice;
    }

    getScore() {
        return this.yatzyDice?.getTotal();
    }

    resetYatzyDice() {
        this.yatzyDice = new YatzyDice();
    }

    setYatzyDice(yatzyDice) {
        this.yatzyDice = yatzyDice;
    }

    addOldYatzyDice() {
        this.oldYatzyDice.push(this.yatzyDice);
    }

    getOldYatzyDice() {
        return this.oldYatzyDice;
    }

    isFinished() {
        return this.yatzyDice?.isFinished() || false;
    }

    getHighScore() {
        return this.getOldYatzyDice()
            .map((oldYatzyDice) => {
                return oldYatzyDice.getTotal();
            })
            .reduce((a, b) => Math.max(a, b), 0);
    }

    static fromMap(map) {
        const player = new Player(map.name, null);
        player.password = map.password || Player.hashPassword("-1");
        if (map.yatzyDice) player.yatzyDice = YatzyDice.fromMap(map.yatzyDice);
        if (map.oldYatzyDice)
            player.oldYatzyDice = map.oldYatzyDice.map((oldYatzyDice) =>
                YatzyDice.fromMap(oldYatzyDice)
            );
        player.wins = map.wins || 0;
        player.losses = map.losses || 0;
        return player;
    }

    toMap() {
        return {
            name: this.name,
            finished: this.isFinished(),
            score: this.getScore(),
        };
    }
}
