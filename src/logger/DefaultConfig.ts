import { Logform } from "winston";

import { ILoggerConfig, LoggerFormat } from "./LoggerConfig";

function printfTemplate(info: Logform.TransformableInfo) {
    const log = `[${info.timestamp}] - ${info.level}: ${info.message}`;

    if (info.stack) {
        return;
    }

    return log;
}

const fileFormat: LoggerFormat = [
    "json",
    {
        name: "timestamp",
        prop: {
            format: "YYYY-MM-DD HH:mm:ss"
        }
    },
    {
        name: "errors",
        prop: {
            stack: true
        }
    }
];

const consoleFormat: LoggerFormat = [
    "colorize",
    {
        name: "timestamp",
        prop: {
            format: "YYYY-MM-DD HH:mm:ss"
        }
    },
    {
        name: "errors",
        prop: {
            stack: true
        }
    },
    {
        name: "printf",
        prop: printfTemplate
    }
];

/**
 * Create a logger config based off the default template.
 *
 * @param {string} name
 * @param {boolean} fileOutput
 * @param {boolean} consoleOutput
 * @param {string} [filename]
 * @return {*}
 */
function getDefaultLoggerConfig(name: string, fileOutput: boolean, consoleOutput: boolean, filename?: string) {
    const config: ILoggerConfig = {
        name,
        fileOutput,
        consoleOutput,
        filename,
        fileFormat,
        consoleFormat
    };

    return config;
}

export default getDefaultLoggerConfig;
