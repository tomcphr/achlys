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
            this.sql.record("items", {
                "id"    :   data.item
            }).then((definition)  =>  {
                let inventory = new (require("./Inventory"))(this.sql, this.session, this.username);
                inventory.dropItem(inventoryId, equipQuantity, (status, message)   =>  {
                    if (status) {
                        self.sql.insert("equipped", {
                            "username"  :   self.username,
                            "item"      :   data.item,
                            "quantity"  :   equipQuantity,
                            "type"      :   definition.type
                        });
                    }
                    callback(status, message);
                });
            });
        }).catch((error) =>  {
            callback(false, "Couldn't retrieve item from inventory: " + error);
        });
    };

    getEquipped () {
        var query = [
            "SELECT *",
            "FROM equipped a",
            "JOIN equiptypes b ON b.id = a.type",
            "WHERE a.? "
        ];
        query = query.join(" ");

        this.sql.query(query, {
            "username"  :   this.username
        }).then((equipped)    =>  {
            callback(true, equipped);
        }).catch((error)   =>  {
            callback(false, "Could not get the provided user's equipment: " + error);
        });
    };
};
module.exports = Equipment;
