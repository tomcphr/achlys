import UserDialog from "./UserDialog";
class Equipment extends UserDialog {
    constructor(scene, config) {
        super("Equipment", "#ui-equipment", "gui/equipment-button.png");

        this.scene = scene;

        this.config = config;
    };
}
export default Equipment;
