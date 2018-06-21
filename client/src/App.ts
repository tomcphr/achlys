declare var require: {
    <T>(path: string): T;
    (paths: string[], callback: (...modules: any[]) => void): void;
    ensure: (
        paths: string[],
        callback: (require: <T>(path: string) => T) => void
    ) => void;
};

// Add interfaces to support JQuery plugins
interface JQueryStatic {
    prompt: any;
}

require("./Deko/Main");
