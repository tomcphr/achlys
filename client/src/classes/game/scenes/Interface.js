import Chat from "../Chat";
import Equipment from "../Equipment";
import Inventory from "../Inventory";

class Interface extends Phaser.Scene {
    constructor () {
        super({
            "active": true
        });
    }

    create (config)
    {
        $("#gameContainer").append("<div id='menuButtons'></div>");

        let equipment = new Equipment(this, config);

        let inventory = new Inventory(this, config);

        let chat = new Chat(this, config);
    }
}

export default Interface;
