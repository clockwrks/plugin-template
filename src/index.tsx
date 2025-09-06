import { Plugin, registerPlugin } from 'enmity/managers/plugins';
import { create } from 'enmity/patcher';
import { getByProps } from 'enmity/metro';
import manifest from '../manifest.json';

const Patcher = create('FullProfileSpoofer');

// Spoofed values
const CUSTOM_NAME = '50cczip';
const CUSTOM_NICK = '50cczip';
const CUSTOM_BIO = `https://nohello.net/
My DMs are always open
Do NOT DM me for
- Ingame suggestions
- Discord suggestions
- Bug reports`;
const CUSTOM_AVATAR_HASH = '64d95fd6056fd65505ac10456b3ebc30';
const CUSTOM_BANNER_HASH = 'f1c1fb11dd06c143e9761c837b610041';
const AVATAR_IS_GIF = false;

const FullProfileSpoofer: Plugin = {
    ...manifest,

    onStart() {
        const UserStore = getByProps('getCurrentUser', 'getUser');
        const UserProfileStore = getByProps('getUserProfile', 'getProfiles');
        const GuildMemberStore = getByProps('getMember', 'getMembers');

        if (!UserStore) return;

        const getAvatarUrl = (userId: string, hash: string) =>
            `https://cdn.discordapp.com/avatars/${userId}/${hash}${AVATAR_IS_GIF ? '.gif' : '.png'}?size=1024`;

        // Patch getUser to spoof username, avatar, banner
        Patcher.after(UserStore, 'getUser', (_self, [id], res) => {
            if (!res) return res;
            if (id === UserStore.getCurrentUser()?.id) {
                return {
                    ...res,
                    username: CUSTOM_NAME,
                    avatar: CUSTOM_AVATAR_HASH,
                    banner: CUSTOM_BANNER_HASH,
                    getAvatarURL: () => getAvatarUrl(id, CUSTOM_AVATAR_HASH),
                };
            }
            return res;
        });

        // Patch getCurrentUser similarly
        Patcher.after(UserStore, 'getCurrentUser', (_self, args, res) => {
            if (!res) return res;
            return {
                ...res,
                username: CUSTOM_NAME,
                avatar: CUSTOM_AVATAR_HASH,
                banner: CUSTOM_BANNER_HASH,
                getAvatarURL: () => getAvatarUrl(res.id, CUSTOM_AVATAR_HASH),
            };
        });

        // Patch bio/About Me
        if (UserProfileStore) {
            Patcher.after(UserProfileStore, 'getUserProfile', (_self, [id], res) => {
                if (!res) return res;
                if (id === UserStore.getCurrentUser()?.id) {
                    return {
                        ...res,
                        bio: CUSTOM_BIO,
                    };
                }
                return res;
            });
        }

        // Patch nicknames
        if (GuildMemberStore) {
            Patcher.after(GuildMemberStore, 'getMember', (_self, [guildId, userId], res) => {
                if (!res) return res;
                if (userId === UserStore.getCurrentUser()?.id) {
                    return {
                        ...res,
                        nick: CUSTOM_NICK,
                    };
                }
                return res;
            });
        }

        console.log('[FullProfileSpoofer] Spoofing applied.');
    },

    onStop() {
        Patcher.unpatchAll();
        console.log('[FullProfileSpoofer] Stopped.');
    },
};

registerPlugin(FullProfileSpoofer);
