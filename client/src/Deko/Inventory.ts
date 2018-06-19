export class Inventory
{
    socket: SocketIOClient.Socket;
    username: string;

    constructor (socket: SocketIOClient.Socket, username: string)
    {
        this.socket = socket;

        this.username = username;
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
        this.socket.emit("getItems", this.username, function (type, message) {
            if (type === "error") {
                var row = $("<tr class='inventoryItem'>");
                var detail = $("<td>", {
                    "colspan"    :    2,
                }).html(message);
                row.append(detail);
                $("#inventoryItemTable").append(row);
            } else if (type === "data") {
                for (var detail in message) {
                    var item = message[detail];

                    var template = {
                        "name"            :     "Item",
                        "description"     :     "Item Description",
                        "quantity"        :     "1",
                    };
                    for (var property in template) {
                        template[property] = item[property];
                    }

                    var name = $("<td>", {
                        "title"    :     template.description
                    }).html(template.name);

                    var quantity = $("<td>", {
                        "class"    :     "fRight"
                    }).html(template.quantity);

                    var row = $("<tr class='inventoryItem'>");
                    row.append(name);
                    row.append(quantity);

                    $("#inventoryItemTable").append(row);
                }
            }
        });
    }
}
