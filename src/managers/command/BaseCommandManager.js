import URL from "url";
import path from "path";

import Manager from "../Manager.js";

import { getClient, getLogger } from "../../LevertClient.js";
import Util from "../../util/Util.js";

import Command from "../../structures/Command.js";

class BaseCommandManager extends Manager {
    constructor(enabled, commandsDir, commandPrefix) {
        super(enabled);

        this.commandsDir = commandsDir;
        this.cmdFileExtension = ".js";

        this.commandPrefix = commandPrefix;
        this.wrapCommands = getClient().config.wrapEvents;

        this.commands = [];
    }

    getCommand(str) {
        const content = str.slice(this.commandPrefix.length),
            [name, args] = Util.splitArgs(content);

        const cmd = this.searchCommands(name);
        return [cmd, args];
    }

    isCommand(str) {
        return str.startsWith(this.commandPrefix);
    }

    getCommands(perm) {
        const commands = this.commands.filter(command => !command.isSubcmd);

        if (typeof perm !== "undefined") {
            const allowedCmds = commands.filter(command => perm >= command.allowed);
            return allowedCmds;
        } else {
            return commands;
        }
    }

    searchCommands(name) {
        const commands = this.getCommands();

        return commands.find(command => {
            if (command.name === name) {
                return true;
            }

            if (command.aliases.length > 0) {
                return command.aliases.includes(name);
            }
        });
    }

    getHelp(perm) {
        const allowedCmds = this.getCommands(perm),
            cmdNames = allowedCmds.map(x => {
                const names = [x.name].concat(x.aliases);
                return names.join("/");
            });

        cmdNames.sort();
        const format = `\`${cmdNames.join("`, `")}\``;

        return format;
    }

    getCommandPaths() {
        let files = Util.getFilesRecSync(this.commandsDir);
        files = files.filter(file => {
            const extension = path.extname(file);
            return extension === this.cmdFileExtension;
        });

        return files;
    }

    async loadCommand(commandPath) {
        commandPath = URL.pathToFileURL(commandPath);
        const cmdProperties = (await import(commandPath)).default;

        if (typeof cmdProperties === "undefined" || typeof cmdProperties.name === "undefined") {
            return false;
        }

        const command = new Command(cmdProperties);

        if (typeof command.load !== "undefined") {
            let loadFunc = command.load.bind(command);

            if (this.wrapCommands) {
                loadFunc = getClient().wrapEvent(loadFunc);
            }

            command.load = loadFunc;
            const res = await loadFunc();

            if (res === false) {
                return false;
            }
        }

        const handlerFunc = command.handler.bind(command);
        command.handler = handlerFunc;

        this.commands.push(command);
        return true;
    }

    async loadCommands() {
        getLogger().info("Loading commands...");
        const paths = this.getCommandPaths();

        if (paths.length === 0) {
            getLogger().info("Couldn't find any commands.");
            return;
        }

        let ok = 0,
            bad = 0;

        for (const commandPath of paths) {
            try {
                const res = await this.loadCommand(commandPath);

                if (res === true) {
                    ok++;
                }
            } catch (err) {
                getLogger().error("Error occured while loading command: " + commandPath, err);
                bad++;
            }
        }

        getLogger().info(`Loaded ${ok + bad} commands. ${ok} successful, ${bad} failed.`);
    }

    bindSubcommand(command, subcommand) {
        const find = this.commands.find(findCmd => {
            return findCmd.name === subcommand && findCmd.parent === command.name;
        });

        if (typeof find === "undefined") {
            getLogger().warn(`Subcommand "${subcommand}" of command "${command.name}" not found.`);
            return false;
        }

        find.parentCmd = command;
        command.subcmds.set(find.name, find);

        if (find.aliases.length > 0) {
            for (const alias of find.aliases) {
                command.subcmds.set(alias, find);
            }
        }

        return true;
    }

    bindSubcommands() {
        getLogger().info("Loading subcommands...");

        let n = 0;

        this.commands.forEach(command => {
            if (command.isSubcmd || command.subcommands.length < 1) {
                return;
            }

            command.subcommands.forEach(subcommand => {
                const res = this.bindSubcommand(command, subcommand);

                if (res === true) {
                    n++;
                }
            });
        });

        if (n === 0) {
            getLogger().info("No subcommands were found.");
        } else {
            getLogger().info(`Loaded ${n} subcommands.`);
        }
    }

    async load() {
        await this.loadCommands();
        this.bindSubcommands();
    }
}

export default BaseCommandManager;
