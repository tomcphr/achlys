class Items {
    constructor(scene) {
        this.scene = scene;

        this.group = scene.physics.add.group();
    };

    render (items) {
        // Remove any existing items on the screen
        this.group.clear(true, true);

        // Loop around each item and render it to the screen
        for (let id in items) {
            let item = items[id];

            let sprite = this.scene.physics.add.image(
                item.x,
                item.y,
                "items",
                (item.id - 1),
            );
            sprite.setOrigin(0, 0);

            this.group.add(sprite);
        }
    }
};
export default Items;
