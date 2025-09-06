import { Plugin, registerPlugin } from 'enmity/managers/plugins';
import { create } from 'enmity/patcher';
import { getByProps, React } from 'enmity/metro';
import { REST } from 'enmity/metro/common';
import { get, set } from 'enmity/api/settings';
import manifest from '../manifest.json';

const Patcher = create('IDProfileSpoofer');

// Hardcoded target ID here (you can later make it a setting)
const TARGET_USER_ID = '1286434074495291494';

const IDProfileSpoofer: Plugin = {
  ...manifest,

  onStart() {
    const UserStore = getByProps('getCurrentUser', 'getUser');
    if (!UserStore) return;

    const currentUser = UserStore.getCurrentUser();
    if (!currentUser) return;
    const currentUserId = currentUser.id;

    const getAvatarUrl = (userId: string, hash: string, isGif: boolean) =>
      `https://cdn.discordapp.com/avatars/${userId}/${hash}${isGif ? '.gif' : '.png'}?size=1024`;

    // Fetch target user via REST
    REST.getUser(TARGET_USER_ID).then((targetUser: any) => {
      const targetAvatarHash = targetUser.avatar;
      const targetBannerHash = targetUser.banner;
      const targetName = targetUser.username;

      // Patch UserStore
      Patcher.after(UserStore, 'getUser', (_self, [id], res) => {
        if (res && id === currentUserId) {
          res.username = targetName;
          res.avatar = targetAvatarHash;
          res.banner = targetBannerHash;
          res.getAvatarURL = () => getAvatarUrl(TARGET_USER_ID, targetAvatarHash, targetAvatarHash?.startsWith('a_'));
        }
        return res;
      });

      Patcher.after(UserStore, 'getCurrentUser', (_self, args, res) => {
        if (res && res.id === currentUserId) {
          res.username = targetName;
          res.avatar = targetAvatarHash;
          res.banner = targetBannerHash;
          res.getAvatarURL = () => getAvatarUrl(TARGET_USER_ID, targetAvatarHash, targetAvatarHash?.startsWith('a_'));
        }
        return res;
      });

      currentUser.username = targetName;
      currentUser.avatar = targetAvatarHash;
      currentUser.banner = targetBannerHash;
      currentUser.getAvatarURL = () => getAvatarUrl(TARGET_USER_ID, targetAvatarHash, targetAvatarHash?.startsWith('a_'));

      // Patch bio/About Me
      const UserProfileStore = getByProps('getUserProfile', 'getProfiles');
      if (UserProfileStore) {
        Patcher.after(UserProfileStore, 'getUserProfile', (_self, [id], res) => {
          if (res && id === currentUserId) {
            res.bio = targetUser.bio || '';
          }
          return res;
        });
      }

      // Patch nickname/display name
      const GuildMemberStore = getByProps('getMember', 'getMembers');
      if (GuildMemberStore) {
        Patcher.after(GuildMemberStore, 'getMember', (_self, [guildId, userId], res) => {
          if (res && userId === currentUserId) {
            res.nick = targetName;
          }
          return res;
        });
      }

      console.log('[IDProfileSpoofer] Spoofing applied for user ID', TARGET_USER_ID);
    }).catch((err) => {
      console.error('[IDProfileSpoofer] Failed to fetch target user:', err);
    });
  },

  onStop() {
    Patcher.unpatchAll();
    console.log('[IDProfileSpoofer] Stopped.');
  }
};

registerPlugin(IDProfileSpoofer);
