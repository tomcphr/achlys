import Inventory from "../Inventory";

class Interface extends Phaser.Scene {
    constructor () {
        super();
    }

    create (config)
    {
        this.inventory = new Inventory(this, config);

        let inventory = this.inventory;
        this.input.keyboard.on("keyup", (event)  =>  {
            // If the user has pressed the letter I
            if (event.keyCode == 73) {
                let displayed = inventory.isDisplayed();

                if (displayed) {
                    inventory.close();
                } else {
                    inventory.open();
                }
            }
        });
    }
}

export default Interface;
