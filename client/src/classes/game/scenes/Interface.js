import Chat from "../Chat";
import Inventory from "../Inventory";

class Interface extends Phaser.Scene {
    constructor () {
        super({
            "active": true
        });
    }

    create (config)
    {
        let inventory = new Inventory(this, config);

        let chat = new Chat(this, config);
    }
}

export default Interface;
