class Trade {
    constructor (sql, socket) {
        this.sql = sql;

        this.socket = socket;

        this.offer = {};
    };

    add (user, item, quantity) {
        // Ensure the user has the item to add.

        // Move the item detail to the trading file

        // Add the detail to the offer
    };

    remove (user, item, quantity) {
        // Move the item back into the users inventory

        // Remove the detail of the item from the offer.
    };

    confirm () {
        // Loop around the offer and add the associated items into each inventory
    };
};
module.exports = Trade;
