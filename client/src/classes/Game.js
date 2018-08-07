import Overworld from "./game/scenes/Overworld";
import Interface from "./game/scenes/Interface";

class Game {
    constructor (socket) {
        this.socket = socket;
    }

    start () {
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

        let scenes = {
            "overworld" :   Overworld,
            "Interface" :   Interface
        };

        for (var scene in scenes) {
            let handler = scenes[scene];

            this.game.scene.add(scene, handler, true, {"socket": this.socket});
        }
    }
}

export default Game;
