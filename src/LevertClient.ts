import discord from "discord.js";
import { ClientOptions } from "discord.js";
import winston from "winston";

import Config from "./config/Config";
import Auth from "./config/Auth";

import Util from "./util/Util";

import createLogger from "./logger/CreateLogger";
import getDefaultLoggerConfig from "./logger/DefaultConfig";

const { Client, GatewayIntentBits, Partials } = discord;

const intents = [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.DirectMessages
    ],
    partials = [Partials.Channel];

class LevertClient {
    public config: Config;
    public auth: Auth;

    public discordClient!: discord.Client;
    public logger!: winston.Logger;

    public loggedIn = false;

    /**
     * Creates an instance of LevertClient and creates a logger from preloaded config.
     *
     * @param {Config} config
     * @param {Auth} auth
     * @memberof LevertClient
     */
    constructor(config: Config, auth: Auth) {
        this.config = config;
        this.auth = auth;

        this.setupLogger();
        this.buildClient();
    }

    /**
     *Starts the bot.
     *
     * @memberof LevertClient
     */
    public async start() {
        this.logger.info("Starting bot...");

        this.logger.info("Logging in...");
        this.discordClient.login(this.auth.token);

        await Util.waitForCondition(() => this.loggedIn, "", 10000, 100);
    }

    private buildClient() {
        this.logger.info("Creating client");

        const options: ClientOptions = {
            intents,
            partials
        };

        const discordClient = new Client(options);
        this.discordClient = discordClient;
    }

    private setupLogger() {
        if (this.logger !== undefined) {
            this.logger.end();
        }

        const config = getDefaultLoggerConfig("El Levert", true, true, this.config.logPath);
        this.logger = createLogger(config);
    }
}

export default LevertClient;
