import DBManager from "./DBManager.js";

import { getClient } from "../../LevertClient.js";

import PermissionDatabase from "../../database/PermissionDatabase.js";

import { DisabledGroup, OwnerGroup, OwnerUser } from "../../structures/permission/PermissionDefaults.js";
import Group from "../../structures/permission/Group.js";
import User from "../../structures/permission/User.js";

const isGroupName = name => {
    return /^[A-Za-z0-9\-_]+$/.test(name);
};

class PermissionManager extends DBManager {
    constructor(enabled = true) {
        super(enabled, "permission", PermissionDatabase, "perm_db");

        this.maxGroupNameLength = getClient().config.maxGroupNameLength;
        const owner = getClient().owner;

        this.ownerUser = OwnerUser;
        this.ownerUser.setId(owner);
    }

    checkName(name) {
        if (name.length > this.maxGroupNameLength) {
            return `The group name can be at most ${this.maxGroupNameLength} characters long.`;
        } else if (!isGroupName(name)) {
            return "The group name must consist of Latin characters, numbers, _ or -.";
        }
    }

    async fetch(id) {
        if (id === this.ownerUser.id) {
            return [OwnerGroup];
        }

        if (!this.enabled) {
            return [DisabledGroup];
        }

        return await this.perm_db.fetch(id);
    }

    async fetchByLevel(level) {
        if (level === this.ownerUser.level) {
            return [OwnerGroup];
        }

        return await this.perm_db.fetchByLevel(level);
    }

    async maxLevel(id) {
        const groups = await this.fetch(id);

        if (!groups) {
            return DisabledGroup.level;
        }

        let maxLevel;

        if (groups.length === 1) {
            maxLevel = groups[0].level;
        } else {
            const levels = groups.map(x => x.level);
            maxLevel = Math.max(...levels);
        }

        return maxLevel;
    }

    async isInGroup(name, id) {
        const currentPerms = await getClient().permManager.fetch(id);

        return currentPerms && currentPerms.find(group => group.name === name);
    }

    async fetchGroup(name) {
        if (name === OwnerGroup.name) {
            return OwnerGroup;
        }

        return await this.perm_db.fetchGroup(name);
    }

    async add(group, id) {
        if (group.name === OwnerGroup.name) {
            return false;
        }

        const user = new User({ id });

        await this.perm_db.add(group, user);

        return user;
    }

    async remove(group, id) {
        if (group.name === OwnerGroup.name) {
            return false;
        }

        const user = new User({ id }),
            res = await this.perm_db.remove(group, user);

        return res;
    }

    async removeAll(id) {
        const user = new User({ id }),
            res = await this.perm_db.removeAll(user);

        return res;
    }

    async addGroup(name, level) {
        if (name === OwnerGroup.name) {
            return false;
        }

        const group = new Group({
            name,
            level
        });

        await this.perm_db.addGroup(group);

        return group;
    }

    async removeGroup(name) {
        if (name === OwnerGroup.name) {
            return false;
        }

        const group = new Group({
            name
        });

        await this.perm_db.removeGroup(group);

        return group;
    }

    async listUsers(fetchUsernames = false) {
        let users = [];

        if (this.owner !== "0") {
            users = [this.ownerUser];
        }

        const userList = await this.perm_db.listUsers();
        users = users.concat(userList);

        if (!fetchUsernames) {
            return users;
        }

        for (const user of users) {
            let find = await getClient().findUserById(user.id);
            user.setUsername(find.username);
        }

        return users;
    }

    async listGroups(fetchUsernames = false) {
        let groups = [];

        if (this.owner !== "0") {
            groups = [OwnerGroup];
        }

        const groupList = await this.perm_db.listGroups();
        groups = groups.concat(groupList);

        if (groups.length < 1) {
            return false;
        }

        groups.sort((a, b) => b.level - a.level);
        const users = await this.listUsers(fetchUsernames);

        for (const group of groups) {
            group.setUsers(users);
        }

        return groups;
    }
}

export default PermissionManager;
