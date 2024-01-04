// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LoggerFormat = string | string[] | Record<string, any>[] | (string | Record<string, any>)[];
type LoggerLevel = "error" | "warning" | "info" | "debug";

interface ILoggerConfig {
    name: string;

    consoleOutput: boolean;
    fileOutput: boolean;

    filename?: string;
    level?: LoggerLevel;

    fileFormat?: LoggerFormat;
    consoleFormat?: LoggerFormat;
}

export { ILoggerConfig, LoggerFormat };
