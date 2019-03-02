class UserDialog {
    constructor(title, identifier, image) {
        this.title = title;
        this.identifier = identifier;
        this.image = image;
        this.displayed = false;
        this.create();
    };

    create () {
        var title = this.title;
        $(this.identifier).dialog({
            autoOpen: false,
            title: title,
            appendTo: "#gameContainer",
            resizable: true,
            minWidth: 450,
            minHeight: 300,
            width: 450,
            height: 300
        });

        $(this.identifier).dialog("widget").draggable("option", "containment", "#gameContainer");
        $(window).resize(function() {
            $(this.identifier).dialog("option", "position", {my: "center", at: "center", of: window});
        });

        let html = "<img class='menuButton' data-identifier='" + this.identifier + "' src='" + this.image + "'></img>";
        $("#menuButtons").append(html);
        this.resetButtonClick();
    };

    open () {
        $(this.identifier).dialog("open");

        this.displayed = true;
    };

    close () {
        this.resetButtonClick();

        $(this.identifier).html("");

        $(this.identifier).dialog("close");

        this.displayed = false;
    };

    resetButtonClick () {
        var self = this;
        let button = ".menuButton[data-identifier='" + this.identifier + "']";
        $(document).off("click", button);
        $(document).on("click", button, ()  =>  {
            if (self.displayed) {
                self.close();
            } else {
                self.open();
            }
        });
    };
}
export default UserDialog;
