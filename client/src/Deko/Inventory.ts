export class Inventory
{
    class: string = ".ui-dialog[aria-describedby='inventoryDialog']";
    socket: SocketIOClient.Socket;

    constructor (socket: SocketIOClient.Socket)
    {
        this.socket = socket;
    }

    open ()
    {
        var self = this;
        $("#inventoryDialog").dialog({
            title: "Inventory",
            appendTo: "#gameContainer",
            resizable: false,
            height: 300,
            width: 400,
            drag: function () {
                $("#inventoryContext").hide();
                $(".itemContainer").off("contextmenu");
            },
            close: function () {
                $(".inventoryItem").remove();
            }
        });
        $("#inventoryDialog").dialog("widget").draggable("option", "containment", "#gameContainer");
        $(window).resize(function() {
            $("#inventoryDialog").dialog("option", "position", {my: "center", at: "center", of: window});
        });

        self.showItems();
    }

    showItems ()
    {
        var self = this;
        self.getAllItems(function (type, message) {
            if (!type) {
                return;
            }

            $("#inventoryItems .inventoryItem").remove();
            for (var key in message) {
                var html = self.createItem(message[key]);
                $("#inventoryItems").append(html);
            }

            self.createContext();
        });
    }

    getAllItems (callback)
    {
        this.socket.emit("items", function (type, message) {
            callback(type, message);
        });
    };

    createItem (item)
    {
        var template = {
            "id"              :     "0",
            "name"            :     "Item",
            "description"     :     "Item Description",
            "quantity"        :     "1",
        };
        for (var property in template) {
            template[property] = item[property];
        }

        $("#templateItem .itemImage").attr("src", "/img/images/item_" + template.id + ".png");

        var quantity = parseInt(template.quantity);

        // Handle for showing 'K' for anything over 10,000 or 'M' for over a million
        var displays = {
            "K" :   1.0e+4,
            "M" :   1.0e+6,
            "B" :   1.0e+9
        };
        var amount = new Intl.NumberFormat().format(quantity);
        for (var shorthand in displays) {
            var threshold = displays[shorthand];

            if (quantity >= threshold) {
                var formatted = (quantity / threshold);
                if (quantity > threshold) {
                    formatted = parseFloat(formatted.toFixed(1));
                }
                amount = new Intl.NumberFormat().format(formatted) + shorthand;
            }
        }

        $("#templateItem .itemQuantity").html(amount);

        var container = $("#templateItem .itemContainer");
        container.attr("data-item", template.id);
        container.attr("data-name", template.name);
        container.attr("data-quantity", quantity);
        container.addClass("inventoryItem");

        var html = $("#templateItem").html();

        container.removeClass("inventoryItem");

        return html;
    }

    createContext ()
    {
        var self = this;

        $(".itemContainer").on("contextmenu", function (e) {
            e.preventDefault();

            var item = $(this).data("item");
            var name = $(this).data("name");
            var quantity = $(this).data("quantity");

            var container = $(this);

            $("#inventoryContext").show();
            $("#inventoryContext").position({
                of: container,
                my: "left center",
                at: "right center",
                collision: "none"
            });

            $(".contextOption").off("click");
            $(".contextOption").click(function () {
                var action = $(this).data("action");

                switch (action) {
                    case "D":
                        self.socket.emit("drop", item, name, quantity, function () {
                            self.showItems();
                        });
                        break;
                }

                $(".contextOption").off("click");
            });

            $(document).on("click", function () {
                $("#inventoryContext").hide();
                $(document).off("click");
            });
        });
    }
}
