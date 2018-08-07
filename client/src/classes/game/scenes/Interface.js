import Inventory from "../Inventory";

class Interface extends Phaser.Scene {
    constructor () {
        super();
    }

    create (config)
    {
        let inventory = new Inventory(this, config);
        inventory.open();
    }
}

export default Interface;
