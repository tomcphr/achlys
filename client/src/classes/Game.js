import Overworld from "./game/scenes/Overworld";
import Interface from "./game/scenes/Interface";

class Game {
    constructor (socket) {
        this.socket = socket;

        this.game = new Phaser.Game({
            parent: "gameContainer",
            type: Phaser.AUTO,
            width: 960,
            height: 600,
            physics: {
                default: "arcade",
                arcade: {
                    gravity: {y: 0},
                    debug: false
                }
            }
        });
    }

    start () {
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
        $("#ui-chat").html("");
        $("#ui-inventory").html("");
        this.socket.removeAllListeners("details");
        this.game.destroy(true);
    }
}

export default Game;
