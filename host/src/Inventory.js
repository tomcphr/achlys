class Inventory {
    constructor (sql, session, username) {
        this.sql = sql;

        this.socket = session.getSocket();

        this.username = username;

        this.maxQuantity = 2147483647;
    };

    getItems (callback) {
        var query = [
            "SELECT a.id `record`, b.id `item`, b.name, b.description, a.quantity",
            "FROM inventories a",
            "JOIN items b ON b.id = a.item",
            "WHERE a.?"
        ];
        query = query.join(" ");

        this.sql.query(query, {
            "username"  :   this.username
        }).then((items)    =>  {
            callback(true, items);
        }).catch((error)   =>  {
            callback(false, "Could not get the provided user's inventory: " + error);
        })
    };

    hasItem (item, callback) {
        this.getItems((status, message)   =>  {
            if (!status) {
                console.log(status, message);
                return;
            }

            let list = [];
            for (let id in message) {
                let data = message[id];
                if (data.item == item) {
                    list.push(data);
                }
            }

            if (list.length) {
                callback(true, list);
                return;
            }

            callback(false, {});
        });
    };

    addItem (item, quantity) {
        let sql = this.sql;
        let socket = this.socket;
        let username = this.username;

        // Ensure that the quantity is parsed as an Int so we can do calculations on it easily.
        quantity = parseInt(quantity);

        let MAX_INT = this.maxQuantity;
        if (quantity > MAX_INT) {
            console.log("You cannot add more than the max item quantity");
            return;
        }

        // Check if we already have the item in our inventory.
        let inserts = [];
        this.hasItem(item, (status, items) =>  {
            // We currently have the item in our inventory then we want to update the record accordingly to stack
            if (status) {
                let added = false;
                for (let id in items) {
                    let i = items[id];

                    i.quantity = parseInt(i.quantity);

                    let insert = {
                        "username"  :   username,
                        "item"      :   item,
                        "quantity"  :   i.quantity
                    };

                    // If the quantity of the item is below the max quantity then try to insert add the additional quantity on.
                    if (i.quantity < MAX_INT && !added) {
                        insert.quantity = (i.quantity + quantity);

                        // If we push the quantity over the threshold then insert a new record with the leftover.
                        if (insert.quantity > MAX_INT) {
                            let leftover = (insert.quantity - MAX_INT);

                            insert.quantity -= leftover;

                            inserts.push({
                                "username"  :   username,
                                "item"      :   item,
                                "quantity"  :   leftover
                            });
                        }
                        added = true;
                    }

                    inserts.push(insert);
                }
            } else {
                inserts.push({
                    "username"  :   username,
                    "item"      :   item,
                    "quantity"  :   quantity
                });
            }

            // Delete the item from the inventory then re-insert it.
            sql.delete("inventories", {
                "username"  :   username,
                "item"      :   item
            }).then(()  =>  {
                for (let id in inserts) {
                    let insert = inserts[id];
                    sql.insert("inventories", insert).then(()  =>  {
                        socket.emit("updated-items");
                    }).catch((error) =>  {
                        console.log(error);
                    });
                }
            });
        });
    };

    dropItem (record, dropQuantity, callback) {
        if (dropQuantity <= 0) {
            callback(false, "An invalid drop quantity has been provided: " + dropQuantity);
            return;
        }

        var self = this;

        this.sql.record("inventories", {
            "id"    :   record
        }).then((data)  =>  {
            var heldQuantity = data.quantity;
            if (dropQuantity > heldQuantity) {
                callback(false, "You do not have this many to drop");
                return;
            }

            // If we are dropping everything in the inventory then delete the record
            if (dropQuantity == heldQuantity) {
                self.sql.delete("inventories", {
                    "id"    :   record
                }).then(()  =>  {
                    callback(true, data);
                }).catch(() =>  {
                    callback(false, error);
                });
                return;
            }

            self.sql.update("inventories", {
                "id"        :   record
            }, {
                "quantity"  :   (heldQuantity - dropQuantity)
            }).then(()  =>  {
                callback(true, data);
            }).catch((error) =>  {
                callback(false, error);
            });
        }).catch(() =>  {
            callback(false, "Couldn't retrieve item from inventory");
        });
    };
};
module.exports = Inventory;
