export class Inventory
{
    socket: SocketIOClient.Socket;

    constructor (socket: SocketIOClient.Socket)
    {
        this.socket = socket;
    }

    open ()
    {
        $("#inventoryDialog").dialog({
            title: "Inventory",
            appendTo: "#gameContainer",
            resizable: false,
            height: 300,
            width: 400,
            close: function () {
                $(".inventoryItem").remove();
            }
        });
        $("#inventoryDialog").dialog("widget").draggable("option", "containment", "#gameContainer");
        $(window).resize(function() {
            $("#inventoryDialog").dialog("option", "position", {my: "center", at: "center", of: window});
        });

        this.populateInventory();
    }

    populateInventory ()
    {
        this.socket.emit("getItems", function (type, message) {
            if (type) {
                for (var data in message) {
                    var item = message[data];

                    var template = {
                        "id"              :     "0",
                        "name"            :     "Item",
                        "description"     :     "Item Description",
                        "quantity"        :     "1",
                    };
                    for (var property in template) {
                        template[property] = item[property];
                    }

                    var icon = $("<img>", {
                        "src"      :    "/img/images/item_" + template.id + ".png",
                        "style"    :     "vertical-align: middle;"
                    });
                    var image = $("<div>", {
                        "class"    :     "itemDetail",
                        "style"    :     "width: 15%;",
                    }).append(icon)

                    var name = $("<div>", {
                        "class"    :     "itemDetail",
                        "title"    :     template.description,
                        "style"    :     "width: 40%; line-height: 32px; vertical-align: middle;",
                    }).html(template.name);

                    var amount = new Intl.NumberFormat().format(parseInt(template.quantity));
                    var quantity = $("<div>", {
                        "class"    :     "itemDetail",
                        "style"    :     "text-align: right; width: 40%; line-height: 32px; vertical-align: middle;",
                    }).html(amount);

                    var row = $("<div class='itemRow inventoryItem fullWidth'>");
                    row.append(image);
                    row.append(name);
                    row.append(quantity);

                    $("#inventoryItems").append(row);

                    $("#inventoryItems").append($("<hr>", {
                        "class"    :     "itemSplit inventoryItem",
                    }));
                }
                $(".itemDetail").tooltip();
            } else {
                var div = $("<div>", {
                    "class"    :     "inventoryItem textCenter ui-state-error ui-corner-all",
                });
                div.append(message);

                $("#inventoryItems").append(div);
            }
        });
    }
}
