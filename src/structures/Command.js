import CommandError from "../errors/CommandError.js";
import Util from "../util/Util.js";
import { getClient } from "../LevertClient.js";

const defaultValues = {
    parent: "",
    allowed: 0,
    subcommands: [],
    description: "",
    usage: "",
    aliases: [],
    helpArgs: ["help", "-help", "-h", "usage"]
};

class Command {
    constructor(options) {
        if (typeof options.name === "undefined") {
            throw new CommandError("Command must have a name.");
        }

        if (typeof options.handler === "undefined") {
            throw new CommandError("Command must have a handler.");
        }

        if (options.subcommand && typeof options.parent === "undefined") {
            throw new CommandError("Subcommands must have a parent command.");
        }

        Object.assign(this, {
            ...defaultValues,
            ...options
        });

        this.subcmds = new Map();

        this.isSubcmd = options.subcommand ?? false;
        this.hasHelp = typeof options.description !== "undefined" || typeof options.usage !== "undefined";
    }

    getSubcmd(name) {
        let subcmds;

        if (this.isSubcmd) {
            subcmds = this.parentCmd.subcmds;
        } else {
            subcmds = this.subcmds;
        }

        if (subcmds.size < 1) {
            return;
        }

        return subcmds.get(name);
    }

    isSubName(name) {
        let subNames;

        if (this.isSubcmd) {
            subNames = this.parentCmd.subcommands;
        } else {
            subNames = this.subcommands;
        }

        return subNames.includes(name);
    }

    getSubcmdList(separator = "|") {
        if (this.isSubcmd) {
            return "";
        }

        return this.subcommands.join(separator);
    }

    matches(name) {
        if (this.name === name) {
            return true;
        }

        if (this.aliases.length > 0) {
            return this.aliases.includes(name);
        }

        return false;
    }

    isHelpCall(args) {
        if (!this.hasHelp) {
            return false;
        }

        const split = args.split(" ");

        for (const part of split) {
            if (this.helpArgs.includes(part)) {
                return true;
            }
        }

        return false;
    }

    getHelpText() {
        let help = "";

        if (this.description.length > 0) {
            help += `Description:\n\`\`\`\n${this.description}\n\`\`\``;

            if (typeof this.usage !== "undefined") {
                help += "\n\n";
            }
        }

        if (this.usage.length > 0) {
            help += `Usage:\n\`\`\`\n${this.usage}\n\`\`\``;
        }

        return help;
    }

    async execute(args, msg) {
        if (!this.isSubcmd) {
            const [subName, subArgs] = Util.splitArgs(args),
                subCmd = this.getSubcmd(subName);

            if (typeof subCmd !== "undefined") {
                return subCmd.execute(subArgs, msg);
            }
        }

        let perm;

        if (typeof msg !== "undefined") {
            perm = await getClient().permManager.maxLevel(msg.author.id);
        }

        if (perm < this.allowed) {
            return `:warning: Access denied.\nOnly permission level ${this.allowed} and above can execute this command.`;
        }

        if (this.isHelpCall(args)) {
            return this.getHelpText();
        }

        return this.handler(args, msg, perm);
    }
}

export default Command;
