import path from "path";
import fs from "fs/promises";

import createLogger from "./logger/CreateLogger";
import getDefaultLoggerConfig from "./logger/DefaultConfig";

import LevertClient from "./LevertClient";

const logger = createLogger(getDefaultLoggerConfig("init", false, true));

const configDirectory = "config",
    configFilename = "config.json",
    authFilename = "auth.json",
    encoding = "utf-8";

const configPath = path.join(configDirectory, configFilename),
    authPath = path.join(configDirectory, authFilename);

(async () => {
    let config, auth;

    logger.info("Reading config file...");
    try {
        config = await fs.readFile(configPath, { encoding });
    } catch (err) {
        logger.error("Error occured while reading config file: ", err);
        return;
    }

    logger.info("Reading auth file...");
    try {
        auth = await fs.readFile(authPath, { encoding });
    } catch (err) {
        logger.error("Error occured while reading auth file: ", err);
        return;
    }

    logger.info("Parsing config file...");
    try {
        config = JSON.parse(config);
    } catch (err) {
        logger.error("Error occured while parsing config file: ", err);
    }

    logger.info("Parsing auth file...");
    try {
        auth = JSON.parse(auth);
    } catch (err) {
        logger.error("Error occured while parsing auth file: ", err);
    }

    logger.end();

    const client = new LevertClient(config, auth);
    await client.start();
})();
