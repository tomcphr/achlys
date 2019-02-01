import Chat from "../Chat";
import Inventory from "../Inventory";

class Interface extends Phaser.Scene {
    constructor () {
        super({
            "active": true
        });
    }

    preload () {
        this.load.image("inventoryButton", "gui/inventory-button.png");
    }

    create (config)
    {
        this.inventory(config);

        this.chat(config);
    }

    inventory (config)
    {
        let inventory = new Inventory(this, config);

        let invX = this.game.config.width - 25;
        let invY = this.game.config.height - 25;

        let invButton = this.add.image(invX, invY, "inventoryButton")
        .setInteractive({useHandCursor: true})
        .on("pointerdown", ()   =>  {
            if (inventory.displayed) {
                inventory.close();
                return;
            }
            inventory.open();
        });
    }

    chat (config)
    {
        let chat = new Chat(this, config);
    }
}

export default Interface;
