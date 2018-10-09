class Inventory {
    constructor(scene, config) {
        this.scene = scene;

        this.config = config;

        this.displayed = false;

        $("#ui-inventory").dialog({
            autoOpen: false,
            title: "Inventory",
            appendTo: "#gameContainer",
            resizable: false,
            width: 480,
            height: 300,
            hide: { effect: "fade", duration: 800 },
            show: { effect: "fade", duration: 800 },
        });

        $("#ui-inventory").dialog("widget").draggable("option", "containment", "#gameContainer");

        $(window).resize(function() {
            $("#ui-inventory").dialog("option", "position", {my: "center", at: "center", of: window});
        });
    };

    isDisplayed () {
        return this.displayed;
    };

    open () {
        $("#ui-inventory").dialog("open");

        let inventory = "<div id='inventoryContents'>";
            inventory += "<div id='itemHolder'></div>";
            inventory += "<div id='itemDetail'>";
                inventory += "<div id='detailName'></div>";
                inventory += "<div id='detailText'></div>";
                inventory += "<div id='detailActions'>";
                    inventory += "<button id='dropItem'>Drop</button>";
                inventory += "</div>";
            inventory += "</div>";
        inventory += "</div>";
        $("#ui-inventory").append(inventory);

        var self = this;
        this.updateInventory();
        this.config.socket.on("updated-items", function () {
            self.updateInventory();
        });

        $(document).on("click", ".itemContainer", function () {
            let name = $(this).attr("data-name");
            let description = $(this).attr("data-description");
            let item = $(this).attr("data-id");
            let quantity = $(this).attr("data-quantity");

            $("#detailText").html(description);
            $("#detailName").html(name);

            $("#equipItem").attr("data-item", item);

            $("#dropItem").attr("data-name", name);
            $("#dropItem").attr("data-item", item);
            $("#dropItem").attr("data-quantity", quantity);

            let visible = $("#itemDetail").is(":visible");
            if (!visible) {
                $("#itemDetail").show();
                $("#itemHolder").css("width", "67%");
            }
        });

        $(document).on("click", "#dropItem", function () {
            let name = $(this).attr("data-name");
            let item = $(this).attr("data-item");
            let quantity = $(this).attr("data-quantity");

            self.config.socket.emit("drop", item, name, quantity, function () {
                $("#itemDetail").hide();
                $("#itemHolder").css("width", "97%");
            });
        });

        self.displayed = true;
    };

    close () {
        $(document).off("click");

        $("#ui-inventory").html("");

        $("#ui-inventory").dialog("close");

        this.displayed = false;
    };

    updateInventory () {
        let self = this;
        this.getItems((items)    =>   {
            self.displayItems(items);
        });
    }

    displayItems (items) {
        $("#itemHolder").html("");
        for (let id in items) {
            let item = items[id];

            let itemDetail = this.getItemDetail(item);

            $("#itemHolder").append(itemDetail.html);
        }
    }

    getItemDetail (item) {
        var template = {
            "id"                :   "0",
            "name"              :   "Item",
            "description"       :   "Item Description",
            "quantity"          :   "1",
            "display"           :   "1",
            "html"              :   "",
        };
        for (var property in template) {
            if (!item.hasOwnProperty(property)) {
                continue;
            }
            template[property] = item[property];
        }

        var quantity = parseInt(template.quantity);

        // Handle for showing 'K' for anything over 10,000 or 'M' for over a million
        var quantities = {
            "K" :   1.0e+4,
            "M" :   1.0e+6,
            "B" :   1.0e+9
        };

        var amount = new Intl.NumberFormat().format(quantity);
        for (var shorthand in quantities) {
            var threshold = quantities[shorthand];

            if (quantity >= threshold) {
                var formatted = (quantity / threshold);
                if (quantity > threshold) {
                    formatted = parseFloat(formatted.toFixed(1));
                }
                amount = new Intl.NumberFormat().format(formatted) + shorthand;
            }
        }

        template.display = amount;

        let base64 = this.scene.textures.getBase64("items", item.id - 1, "image/png");
        template.html += "<div class='itemContainer' ";
            template.html += "data-id='" + template.id + "' ";
            template.html += "data-name='" + template.name + "' ";
            template.html += "data-description='" + template.description + "' ";
            template.html += "data-quantity='" + template.quantity + "' ";
        template.html += ">";
        template.html += "<img class='itemImage' src='" + base64 + "'>";
        template.html += "<div class='itemText'>" + template.name + "</div>";
        template.html += "<div class='itemQuantity'>" + template.display + "</div>";
        template.html += "</div>";

        return template;
    };

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
    };
}
export default Inventory;
