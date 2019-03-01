class Equipment {
    constructor (sql, session, username) {
        this.sql = sql;

        this.session = session;

        this.socket = session.getSocket();

        this.username = username;
    };

    equipItem (inventoryId, equipQuantity, callback) {
        if (equipQuantity <= 0) {
            callback(false, "An invalid equip quantity has been provided: " + equipQuantity);
            return;
        }

        var self = this;
        this.sql.record("inventories", {
            "id"    :   inventoryId
        }).then((data)  =>  {
            let inventory = new (require("./Inventory"))(this.sql, this.session, this.username);
            inventory.dropItem(inventoryId, equipQuantity, (status, message)   =>  {
                if (status) {
                    self.sql.insert("equipped", {
                        "username"  :   self.username,
                        "item"      :   data.item,
                        "quantity"  :   equipQuantity
                    });
                }
                callback(status, message);
            });
        }).catch((error) =>  {
            callback(false, "Couldn't retrieve item from inventory: " + error);
        });
    };
};
module.exports = Equipment;
