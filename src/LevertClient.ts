import discord from "discord.js";
import { ClientOptions } from "discord.js";

import Config from "./config/Config";
import Auth from "./config/Auth";

const { 
    Client,
    GatewayIntentBits,
    Partials
} = discord;

const intents = [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.DirectMessages
],
      partials = [
    Partials.Channel
];

class LevertClient {
    public config: Config;
    public auth: Auth;

    public discordClient: discord.Client;

    public loggedIn = false;

    constructor(config: Config, auth: Auth) {
        this.config = config;
        this.auth = auth;

        const options: ClientOptions = {
            intents: intents,
            partials: partials
        };

        const discordClient = new Client(options);
        this.discordClient = discordClient;
    }

    async start() {
        await this.discordClient.login(this.auth.token);
        this.loggedIn = true;
    }
}

export default LevertClient;