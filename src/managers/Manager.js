import ManagerError from "../errors/ManagerError.js";

function load(...args) {
    if (!this.enabled) {
        return;
    }

    return this.childLoad(...args);
}

function unload(...args) {
    if (!this.enabled) {
        return;
    }

    if (typeof this.childUnload !== "function") {
        return;
    }

    return this.childUnload(...args);
}

class Manager {
    constructor(enabled = true) {
        if (typeof this.load !== "function") {
            throw new ManagerError("Child class must have a load function");
        }

        this.enabled = enabled;

        this.childLoad = this.load;
        this.load = load.bind(this);

        this.childUnload = this.unload;
        this.unload = unload.bind(this);
    }
}

export default Manager;
