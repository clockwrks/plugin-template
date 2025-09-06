import { Plugin, registerPlugin } from 'enmity/managers/plugins';
import { create } from 'enmity/patcher';
import { getByProps } from 'enmity/metro';
import manifest from '../manifest.json';

const Patcher = create('FullProfileSpoofer');

// Your spoofed values
const CUSTOM_NAME = '50cczip';
const CUSTOM_NICK = '50cczip';
const CUSTOM_BIO = `https://nohello.net/
My DMs are always open
Do NOT DM me for
- Ingame suggestions
- Discord suggestions
- Bug reports`;

// Avatar & banner
const CUSTOM_AVATAR_HASH = '64d95fd6056fd65505ac10456b3ebc30';
const CUSTOM_BANNER_HASH = 'f1c1fb11dd06c143e9761c837b610041';
const AVATAR_IS_GIF = false; // set true if it's a GIF

const FullProfileSpoofer: Plugin = {
  ...manifest,

  onStart() {
    const UserStore = getByProps('getCurrentUser', 'getUser');
    if (!UserStore) return;

    const currentUser = UserStore.getCurrentUser();
    if (!currentUser) return;

    const currentUserId = currentUser.id;

    const getAvatarUrl = (userId: string, hash: string) =>
      `https://cdn.discordapp.com/avatars/${userId}/${hash}${AVATAR_IS_GIF ? '.gif' : '.png'}?size=1024`;

    // Patch username/avatar/banner globally
    Patcher.after(UserStore, 'getUser', (_self, [id], res) => {
      if (res && id === currentUserId) {
        res.username = CUSTOM_NAME;
        res.avatar = CUSTOM_AVATAR_HASH;
        res.banner = CUSTOM_BANNER_HASH;
        res.getAvatarURL = () => getAvatarUrl(currentUserId, CUSTOM_AVATAR_HASH);
      }
      return res;
    });

    Patcher.after(UserStore, 'getCurrentUser', (_self, args, res) => {
      if (res && res.id === currentUserId) {
        res.username = CUSTOM_NAME;
        res.avatar = CUSTOM_AVATAR_HASH;
        res.banner = CUSTOM_BANNER_HASH;
        res.getAvatarURL = () => getAvatarUrl(currentUserId, CUSTOM_AVATAR_HASH);
      }
      return res;
    });

    currentUser.username = CUSTOM_NAME;
    currentUser.avatar = CUSTOM_AVATAR_HASH;
    currentUser.banner = CUSTOM_BANNER_HASH;
    currentUser.getAvatarURL = () => getAvatarUrl(currentUserId, CUSTOM_AVATAR_HASH);

    // Patch bio/About Me
    const UserProfileStore = getByProps('getUserProfile', 'getProfiles');
    if (UserProfileStore) {
      Patcher.after(UserProfileStore, 'getUserProfile', (_self, [id], res) => {
        if (res && id === currentUserId) {
          res.bio = CUSTOM_BIO;
        }
        return res;
      });
    }

    // Patch server nickname/display name
    const GuildMemberStore = getByProps('getMember', 'getMembers');
    if (GuildMemberStore) {
      Patcher.after(GuildMemberStore, 'getMember', (_self, [guildId, userId], res) => {
        if (res && userId === currentUserId) {
          res.nick = CUSTOM_NICK;
        }
        return res;
      });
    }

    // Fake Nitro for client-side preview (optional)
    const EditUserProfileBanner = getByProps('default', 'EditUserProfileBanner');
    if (EditUserProfileBanner) {
      Patcher.instead(EditUserProfileBanner, 'default', (_self, args, orig) => {
        const user = args[0].user;
        const premiumType = user.premiumType;
        user.premiumType = 2; // pretend to have Nitro
        const result = orig.apply(_self, args);
        user.premiumType = premiumType;
        return result;
      });
    }

    console.log('[FullProfileSpoofer] Spoofing applied.');
  },

  onStop() {
    Patcher.unpatchAll();
    console.log('[FullProfileSpoofer] Stopped.');
  }
};

registerPlugin(FullProfileSpoofer);
