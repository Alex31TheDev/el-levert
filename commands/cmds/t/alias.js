import Util from "../../../util/Util.js";
import { getClient } from "../../../LevertClient.js";

export default {
    name: "alias",
    parent: "tag",
    subcommand: true,
    handler: async function(args, msg, perm) {
        if(args.length === 0) {
            return ":information_source: `t alias name other_tag [args]`";
        }

        const [t_name, t_args] = Util.splitArgs(args),
              [a_name, a_args] = Util.splitArgs(t_args);

        const e1 = getClient().tagManager.checkName(t_name),
              e2 = getClient().tagManager.checkName(a_name);

        if(e1 ?? e2) {
            return ":warning: " + e1 ?? e2;
        }

        if(this.parentCmd.subcommands.includes(t_name)) {
            return `:police_car: ${t_name} is a __command__, not a __tag__. You can't manipulate commands.`;
        }
        
        if(a_name.length === 0) {
            return `:warning: Alias target must be specified.
If you want to de-alias the tag, \`edit\` it.`;
        }

        let tag = await getClient().tagManager.fetch(t_name),
            out = "";
        
        if(!tag) {
            try {
                tag = await getClient().tagManager.add(t_name, "", msg.author.id, false);
            } catch(err) {
                if(err.name === "TagError") {
                    return ":warning: " + err.message;
                }
    
                throw err;
            }

            out = `Created tag **${t_name}**. `;
        }

        if(perm < 1 && tag.owner !== msg.author.id) {
            const owner = await getClient().tagManager.ownerTag(tag);
            
            return `:warning: You can only edit your own tags. Tag is owned by \`${owner}\`.`;
        }

        const a_tag = await getClient().tagManager.fetch(a_name),
              a_hops = a_tag.hops;

        try {
            await getClient().tagManager.alias(tag, a_name, a_hops, a_args);
        } catch(err) {
            if(err.name === "TagError") {
                return ":warning: " + err.message;
            }

            throw err;
        }

        return `:white_check_mark: ${out}Aliased tag **${t_name}** to **${a_name}**.`;
    }
}