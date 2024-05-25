export class Room {
    constructor(id) {
        this.id = id;
        this.players = [];
        this.maxPlayers = 4;
        this.status = "WAITING";
    }
    getId() {
        return this.id;
    }
    getMaxPlayers() {
        return this.maxPlayers;
    }
    getStatus() {
        return this.status;
    }
    setStatus(status) {
        if (
            status !== "WAITING" &&
            status !== "STARTED" &&
            status !== "FINISHED"
        ) {
            throw new Error("Invalid status");
        }
        this.status = status;
    }
    addPlayer(player) {
        if (this.players.length >= this.maxPlayers) {
            throw new Error("Room is full");
        } else if (this.players.includes(player)) {
            throw new Error("Player already in room");
        }
        this.players.push(player);
    }
    removePlayer(player) {
        this.players = this.players.filter(
            (p) => p.getSession() !== player.getSession()
        );
    }
    getPlayers() {
        return this.players;
    }
    getPlayerBySessionID(sessionID) {
        return this.players.find((player) => player.getSession() === sessionID);
    }

    static fromMap(map, players) {
        const room = new Room(map.id);
        room.maxPlayers = map.maxPlayers;
        room.players = players.filter((player) =>
            map.players
                .map((username) => username.toLowerCase())
                .includes(player.name.toLowerCase())
        );
        room.status = map.status;
        return room;
    }

    toMap() {
        return {
            id: this.id,
            players: this.players.map((player) => player.toMap()),
            maxPlayers: this.maxPlayers,
            status: this.status,
        };
    }
}
