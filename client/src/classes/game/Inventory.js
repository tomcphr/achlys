class Inventory {
    constructor(scene, config) {
        this.scene = scene;

        this.config = config;
    }

    open () {
    }

    getItems (callback) {
        this.config.socket.emit("items", (type, message)    =>  {
            if (!type) {
                return;
            }

            let items = [];
            for (var i = 0; i < message.length; i++) {
                let item = message[i];

                items.push(item);
            }

            callback(items);
        });
    }
}
export default Inventory;
