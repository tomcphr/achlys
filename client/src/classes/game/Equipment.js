class Equipment {
    constructor(scene, config) {
        this.create();

        this.scene = scene;

        this.config = config;
    };

    create () {
        let html = "<img id='equipmentButton' class='menuButton' src='gui/equipment-button.png'></img>";
        $("#menuButtons").append(html);
    };
}
export default Equipment;
