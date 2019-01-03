export class Table {
    constructor(smallBlind, bigBlind, minPlayers, maxPlayers, minBuyIn, maxBuyIn) {
        this.smallBlind = smallBlind;
        this.bigBlind = bigBlind;
        this.minPlayers = minPlayers;
        this.maxPlayers = maxPlayers;
        this.players = [];
        this.dealer = 0; //Track the dealer position between games
        this.minBuyIn = minBuyIn;
        this.maxBuyIn = maxBuyIn;
        this.playersToRemove = [];
        this.playersToAdd = [];
        this.turnBet = {};
        this.gameWinners = [];
        this.gameLosers = [];
        //Validate acceptable value ranges.
        var err;
        if (minPlayers < 2) { //require at least two players to start a game.
            err = new Error(101, 'Parameter [minPlayers] must be a postive integer of a minimum value of 2.');
        } else if (maxPlayers > 10) { //hard limit of 10 players at a table.
            err = new Error(102, 'Parameter [maxPlayers] must be a positive integer less than or equal to 10.');
        } else if (minPlayers > maxPlayers) { //Without this we can never start a game!
            err = new Error(103, 'Parameter [minPlayers] must be less than or equal to [maxPlayers].');
        }

        if (err) {
            throw err;
        }
    }
    smallBlind:number
    bigBlind:number
    minPlayers:number
    maxPlayers:number
    minBuyIn:number
    maxBuyIn:number
    players:Player[]
    playersToRemove:Player[]
    playersToAdd:Player[]
    gameWinners:Winner[]
    gameLosers:Player[]
    getHandForPlayerName(playerName) {
        const p=this.players.filter(v=>v.playerName===playerName)
        if(p.length){
            return p[0]
        }
        return []
    };
    getDeal() {
        return this.game.board;
    };
    getEventEmitter() {
        return this.eventEmitter;
    };
    getCurrentPlayer() {
        return this.players[this.currentPlayer].playerName;
    };
    getPreviousPlayerAction() {
        return this.turnBet;
    };
    // Player actions: Check(), Fold(), Bet(bet), Call(), AllIn()
    check(playerName) {
        var currentPlayer = this.currentPlayer;
        if (playerName === this.players[currentPlayer].playerName) {
            this.players[currentPlayer].Check();
            return true;
        } else {
            // todo: check if something went wrong ( not enough money or things )
            console.log("wrong user has made a move");
            return false;
        }
    };
    fold(playerName) {
        var currentPlayer = this.currentPlayer;
        if (playerName === this.players[currentPlayer].playerName) {
            this.players[currentPlayer].Fold();
            return true;
        } else {
            console.log("wrong user has made a move");
            return false;
        }
    };
    call(playerName) {
        var currentPlayer = this.currentPlayer;
        if (playerName === this.players[currentPlayer].playerName) {
            this.players[currentPlayer].Call();
            return true;
        } else {
            console.log("wrong user has made a move");
            return false;
        }
    };
    bet(playerName, amt) {
        var currentPlayer = this.currentPlayer;
        if (playerName === this.players[currentPlayer].playerName) {
            this.players[currentPlayer].Bet(amt);
            return true;
        } else {
            console.log("wrong user has made a move");
            return false;
        }
    };
    getWinners() {
        return this.gameWinners;
    };
    getLosers() {
        return this.gameLosers;
    };
    getAllHands() {
        var all = this.losers.concat(this.players);
        var allHands = [];
        for (var i in all) {
            allHands.push({
                playerName: all[i].playerName,
                chips: all[i].chips,
                hand: all[i].cards,
            });
        }
        return allHands;
    };

    initNewRound() {
        var i;
        this.dealer += 1;
        if (this.dealer >= this.players.length) {
            this.dealer = 0;
        }
        this.game.pot = 0;
        this.game.roundName = 'Deal'; //Start the first round
        this.game.betName = 'bet'; //bet,raise,re-raise,cap
        this.game.bets.splice(0, this.game.bets.length);
        this.game.deck.splice(0, this.game.deck.length);
        this.game.board.splice(0, this.game.board.length);
        for (i = 0; i < this.players.length; i += 1) {
            this.players[i].folded = false;
            this.players[i].talked = false;
            this.players[i].allIn = false;
            this.players[i].cards.splice(0, this.players[i].cards.length);
        }
        fillDeck(this.game.deck);
        this.NewRound();
    };

    StartGame() {
        //If there is no current game and we have enough players, start a new game.
        if (!this.game) {
            this.game = new Game(this.smallBlind, this.bigBlind);
            this.NewRound();
        }
    };

    AddPlayer(playerName, chips) {
        if (chips >= this.minBuyIn && chips <= this.maxBuyIn) {
            var player = new Player(playerName, chips, this);
            this.playersToAdd.push(player);
        }
        if (this.players.length === 0 && this.playersToAdd.length >= this.minPlayers) {
            this.StartGame();
        }
    };
    removePlayer(playerName) {
        for (var i in this.players) {
            if (this.players[i].playerName === playerName) {
                this.playersToRemove.push(i);
                this.players[i].Fold();
            }
        }
        for (var i in this.playersToAdd) {
            if (this.playersToAdd[i].playerName === playerName) {
                this.playersToAdd.splice(i, 1);
            }
        }
    }
    NewRound() {
        // Add players in waiting list
        var removeIndex = 0;
        for (var i in this.playersToAdd) {
            if (removeIndex < this.playersToRemove.length) {
                var index = this.playersToRemove[removeIndex];
                this.players[index] = this.playersToAdd[i];
                removeIndex += 1;
            } else {
                this.players.push(this.playersToAdd[i]);
            }
        }
        this.playersToRemove = [];
        this.playersToAdd = [];
        this.gameWinners = [];
        this.gameLosers = [];


        var i, smallBlind, bigBlind;
        //Deal 2 cards to each player
        for (i = 0; i < this.players.length; i += 1) {
            this.players[i].cards.push(this.game.deck.pop());
            this.players[i].cards.push(this.game.deck.pop());
            this.game.bets[i] = 0;
            this.game.roundBets[i] = 0;
        }
        //Identify Small and Big Blind player indexes
        smallBlind = this.dealer + 1;
        if (smallBlind >= this.players.length) {
            smallBlind = 0;
        }
        bigBlind = this.dealer + 2;
        if (bigBlind >= this.players.length) {
            bigBlind -= this.players.length;
        }
        //Force Blind Bets
        this.players[smallBlind].chips -= this.smallBlind;
        this.players[bigBlind].chips -= this.bigBlind;
        this.game.bets[smallBlind] = this.smallBlind;
        this.game.bets[bigBlind] = this.bigBlind;

        // get currentPlayer
        this.currentPlayer = this.dealer + 3;
        if (this.currentPlayer >= this.players.length) {
            this.currentPlayer -= this.players.length;
        }

        this.eventEmitter.emit("newRound");
    };
}