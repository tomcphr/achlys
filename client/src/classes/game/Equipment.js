import UserDialog from "./UserDialog";
class Equipment extends UserDialog {
    constructor(scene, config) {
        super("Equipment", "#ui-equipment", "gui/equipment-button.png");

        this.scene = scene;

        this.config = config;
    };

    open() {
        super.open();

        this.getEquipped((data) =>  {
            console.log(data);
        });
    };

    getEquipped(callback) {
        this.config.socket.emit("equipped", (type, message)    =>  {
            if (!type) {
                return;
            }

            let equipment = [];
            for (var i = 0; i < message.length; i++) {
                let item = message[i];

                equipment.push(item);
            }

            callback(equipment);
        });
    };

    getTypes () {
        return {
            "0" :   "Items",
            "1" :   "Weapons",
            "2" :   "Armour",
        };
    };
}
export default Equipment;
