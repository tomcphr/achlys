import Overworld from "./game/scenes/Overworld";
import Interface from "./game/scenes/Interface";

class Game {
    constructor (socket) {
        var gameContainer = "<div id='gameContainer'>";
                gameContainer += "<div id='ui-chat'></div>";
                gameContainer += "<div id='ui-inventory'></div>";
            gameContainer += "</div>";
        $("body").append(gameContainer);

        this.socket = socket;

        this.game = new Phaser.Game({
            type: Phaser.AUTO,
            physics: {
                default: "arcade",
                arcade: {
                    gravity: {y: 0},
                    debug: false
                }
            },
            scale: {
                parent: "gameContainer",
                width: 960,
                height: 600,
                mode: Phaser.Scale.FIT,
                autoCenter: Phaser.Scale.CENTER_BOTH
            }
        });
        let scenes = {
            "overworld" :   Overworld,
            "Interface" :   Interface
        };

        for (var scene in scenes) {
            let handler = scenes[scene];

            this.game.scene.add(scene, handler, true, {"socket": this.socket});
        }
    }

    stop () {
        $("#gameContainer").remove();
        this.socket.removeAllListeners("gameTick");
        this.game.destroy(true);
    }
}

export default Game;
