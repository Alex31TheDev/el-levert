import { getClient } from "../../LevertClient.js";

export default {
    name: "reload_commands",
    ownerOnly: true,
    handler: async _ => {
        await getClient().commandManager.reloadCommands();

        return ":white_check_mark: Reloaded commands!";
    }
};
