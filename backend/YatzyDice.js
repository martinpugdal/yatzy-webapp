export class YatzyDice {
    constructor() {
        this.values = [0, 0, 0, 0, 0];
        this.throwCount = 0;
        this.bonusThreshold = 63;
        this.bonus = 50;
        this.bonusGranted = false;
        this.results = [
            -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
        ]; // 15 fields
        this.locked = [false, false, false, false, false]; // 5 dice
        this.roomID = "";
    }

    static fromMap(map) {
        const yatzyDice = new YatzyDice();
        yatzyDice.values = map.values;
        yatzyDice.throwCount = map.throwCount;
        yatzyDice.bonusThreshold = 63;
        yatzyDice.bonus = 50;
        yatzyDice.bonusGranted = map.bonusGranted;
        yatzyDice.results = map.results;
        yatzyDice.locked = map.locked;
        yatzyDice.roomID = map.roomID;
        return yatzyDice;
    }

    getRoomID() {
        return this.roomID;
    }

    setRoomID(roomID) {
        this.roomID = roomID;
    }

    getRandom() {
        return Math.floor(Math.random() * 6) + 1;
    }

    getValues() {
        return this.values;
    }

    setValues(values) {
        this.values = values;
    }

    getSum() {
        // sum of the first 6 fields
        return this.results
            .slice(0, 6)
            .map((result) => (result !== -1 ? result : 0))
            .reduce((a, b) => a + b, 0);
    }

    getTotal() {
        const total = this.results
            .map((result) => (result !== -1 ? result : 0))
            .reduce((a, b) => a + b, 0);
        return total + (this.isBonusGranted() ? this.getBonus() : 0);
    }

    isBonusThresholdReached() {
        return this.getSum() >= this.bonusThreshold;
    }

    isBonusGranted() {
        return this.bonusGranted;
    }

    checkBonus() {
        if (this.isBonusThresholdReached() && !this.bonusGranted) {
            this.bonusGranted = true;
        }
        return this.bonusGranted;
    }

    getBonus() {
        return this.bonus;
    }

    lockDie(index) {
        this.locked[index] = true;
    }

    unlockDie(index) {
        this.locked[index] = false;
    }

    isDieLocked(index) {
        return this.locked[index];
    }

    getThrowCount() {
        return this.throwCount;
    }

    resetThrowCount() {
        this.throwCount = 0;
        this.locked = [false, false, false, false, false];
        this.values = [0, 0, 0, 0, 0];
    }

    throw() {
        for (let i = 0; i < 5; i++) {
            if (this.locked[i]) {
                continue;
            }
            this.values[i] = this.getRandom();
        }
        this.throwCount++;
    }

    getCombinations() {
        const combinations = [].fill(0, 0, 14);
        for (let i = 0; i < 6; i++) {
            combinations[i] = this.sameValuePoints(i);
        }
        combinations[6] = this.onePairPoints();
        combinations[7] = this.twoPairPoints();
        combinations[8] = this.threeSamePoints();
        combinations[9] = this.fourSamePoints();
        combinations[10] = this.fullHousePoints();
        combinations[11] = this.smallStraightPoints();
        combinations[12] = this.largeStraightPoints();
        combinations[13] = this.chancePoints();
        combinations[14] = this.yatzyPoints();
        return combinations;
    }

    getResult(field) {
        return this.results[field];
    }

    getResults() {
        return this.results;
    }

    chooseField(field) {
        if (this.results[field] !== -1) {
            return false;
        }
        const points = this.getCombinations()[field];
        this.results[field] = points;
        this.checkBonus();
        return true;
    }

    frequency() {
        const frequency = [0, 0, 0, 0, 0, 0];
        for (const value of this.values) {
            frequency[value - 1]++;
        }
        return frequency;
    }

    sameValuePoints(value) {
        return this.frequency()[value] * (value + 1);
    }

    onePairPoints() {
        let pairPoints = 0;
        const frequency = this.frequency();
        for (let i = 0; i < frequency.length; i++) {
            if (frequency[i] >= 2 && frequency[i] < 4) {
                pairPoints = i + 1;
            }
        }
        return pairPoints * 2;
    }

    twoPairPoints() {
        let points = 0;
        const pair1Points = this.onePairPoints() / 2;
        const frequency = this.frequency();
        for (let i = 0; i < pair1Points - 1; i++) {
            if (frequency[i] >= 2 && frequency[i] < 4) {
                points = pair1Points * 2 + (i + 1) * 2;
            }
        }
        return points;
    }

    threeSamePoints() {
        let threeSamePoints = 0;
        const frequency = this.frequency();
        for (let i = 0; i < frequency.length; i++) {
            if (frequency[i] >= 3) {
                threeSamePoints = (i + 1) * 3;
            }
        }
        return threeSamePoints;
    }

    fourSamePoints() {
        let fourSamePoints = 0;
        const frequency = this.frequency();
        for (let i = 0; i < frequency.length; i++) {
            if (frequency[i] >= 4) {
                fourSamePoints = (i + 1) * 4;
            }
        }
        return fourSamePoints;
    }

    fullHousePoints() {
        let fullHousePoints = 0;
        let threeSamePoints = 0;
        let pairPoints = 0;
        const frequency = this.frequency();
        for (let i = 0; i < frequency.length; i++) {
            if (frequency[i] >= 3) {
                threeSamePoints = i + 1;
            }
        }
        for (let i = 0; i < frequency.length; i++) {
            if (frequency[i] >= 2 && threeSamePoints !== i + 1) {
                pairPoints = i + 1;
            }
        }
        if (threeSamePoints !== 0 && pairPoints !== 0) {
            fullHousePoints = threeSamePoints * 3 + pairPoints * 2;
        }
        return fullHousePoints;
    }

    smallStraightPoints() {
        let smallStraightPoints = 0;
        const frequency = this.frequency();
        if (
            frequency[0] === 1 &&
            frequency[1] === 1 &&
            frequency[2] === 1 &&
            frequency[3] === 1 &&
            frequency[4] === 1
        ) {
            smallStraightPoints = 1 + 2 + 3 + 4 + 5;
        }
        return smallStraightPoints;
    }

    largeStraightPoints() {
        let largeStraightPoints = 0;
        const frequency = this.frequency();
        if (
            frequency[1] === 1 &&
            frequency[2] === 1 &&
            frequency[3] === 1 &&
            frequency[4] === 1 &&
            frequency[5] === 1
        ) {
            largeStraightPoints = 20;
        }
        return largeStraightPoints;
    }

    chancePoints() {
        let chancePoints = 0;
        for (const face of this.getValues()) {
            chancePoints += face;
        }
        return chancePoints;
    }

    yatzyPoints() {
        let yatzyPoints = 0;
        const frequency = this.frequency();
        for (const freqNum of frequency) {
            if (freqNum === 5) {
                yatzyPoints = 50;
            }
        }
        return yatzyPoints;
    }

    isFinished() {
        return this.results.every((result) => result !== -1);
    }

    toMap() {
        return {
            values: this.values,
            throwCount: this.throwCount,
            sum: this.getSum(),
            bonusThreshold: this.bonusThreshold,
            bonus: this.bonus,
            bonusGranted: this.bonusGranted,
            total: this.getTotal(),
            combinations: this.getCombinations(),
            results: this.results,
            locked: this.locked,
        };
    }
}
