class Player {
    constructor(playerName:string, chips:number, table:Table) {
        this.playerName = playerName;
        this.chips = chips;
        this.folded = false;
        this.allIn = false;
        this.talked = false;
        this.table = table; //Circular reference to allow reference back to parent object.
        this.cards = [];
    }
    playerName:string
    chips:number
    folded:boolean
    allIn:boolean
    talked:boolean
    table:Table
    cards:CARDS[]
    // receive money
    GetChips(cash) {
        this.chips += cash;
    };
// 看牌/让牌
    // Player actions: Check(), Fold(), Bet(bet), Call(), AllIn()
    Check() {
        var checkAllow, v, i;
        checkAllow = true;
        for (v = 0; v < this.table.game.bets.length; v += 1) {
            if (this.table.game.bets[v] !== 0) {
                checkAllow = false;
            }
        }
        if (checkAllow) {
            for (i = 0; i < this.table.players.length; i += 1) {
                if (this === this.table.players[i]) {
                    this.table.game.bets[i] = 0;
                    this.talked = true;
                }
            }
            //Attemp to progress the game
            this.turnBet = { action: "check", playerName: this.playerName }
            progress(this.table);
        } else {
            console.log("Check not allowed, replay please");
        }
    };
// 弃牌
    Fold() {
        var i, bet;
        //Move any current bet into the pot
        for (i = 0; i < this.table.players.length; i += 1) {
            if (this === this.table.players[i]) {
                bet = parseInt(this.table.game.bets[i], 10);
                this.table.game.bets[i] = 0;
                this.table.game.pot += bet;
                this.talked = true;
            }
        }
        //Mark the player as folded
        this.folded = true;
        this.turnBet = { action: "fold", playerName: this.playerName }

        //Attemp to progress the game
        progress(this.table);
    };

//  押注
    Bet(bet) {
        var i;
        if (this.chips > bet) {
            for (i = 0; i < this.table.players.length; i += 1) {
                if (this === this.table.players[i]) {
                    this.table.game.bets[i] += bet;
                    this.table.players[i].chips -= bet;
                    this.talked = true;
                }
            }

            //Attemp to progress the game
            this.turnBet = { action: "bet", playerName: this.playerName, amount: bet }
            progress(this.table);
        } else {
            console.log('You don\'t have enought chips --> ALL IN !!!');
            this.AllIn();
        }
    };
// 跟注
    Call() {
        var maxBet, i;
        maxBet = getMaxBet(this.table.game.bets);
        if (this.chips > maxBet) {
            //Match the highest bet
            for (i = 0; i < this.table.players.length; i += 1) {
                if (this === this.table.players[i]) {
                    if (this.table.game.bets[i] >= 0) {
                        this.chips += this.table.game.bets[i];
                    }
                    this.chips -= maxBet;
                    this.table.game.bets[i] = maxBet;
                    this.talked = true;
                }
            }
            //Attemp to progress the game
            this.turnBet = { action: "call", playerName: this.playerName, amount: maxBet }
            progress(this.table);
        } else {
            console.log('You don\'t have enought chips --> ALL IN !!!');
            this.AllIn();
        }
    };
// 全下
    AllIn() {
        var i, allInValue = 0;
        for (i = 0; i < this.table.players.length; i += 1) {
            if (this === this.table.players[i]) {
                if (this.table.players[i].chips !== 0) {
                    allInValue = this.table.players[i].chips;
                    this.table.game.bets[i] += this.table.players[i].chips;
                    this.table.players[i].chips = 0;

                    this.allIn = true;
                    this.talked = true;
                }
            }
        }

        //Attemp to progress the game
        this.turnBet = { action: "allin", playerName: this.playerName, amount: allInValue }
        progress(this.table);
    };
}