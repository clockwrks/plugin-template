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

// Replace with correct hash from Discord CDN
const CUSTOM_AVATAR_HASH = '64d95fd6056fd65505ac10456b3ebc30';
const CUSTOM_BANNER_HASH = 'f1c1fb11dd06c143e9761c837b610041';
const AVATAR_IS_GIF = true; // set to true if it's an animated GIF

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

    // Username, avatar, banner
    Patcher.after(UserStore, 'getUser', (self, [id], res) => {
      if (res && id === currentUserId) {
        res.username = CUSTOM_NAME;
        res.avatar = CUSTOM_AVATAR_HASH;
        res.banner = CUSTOM_BANNER_HASH;
        res.getAvatarURL = () => getAvatarUrl(currentUserId, CUSTOM_AVATAR_HASH);
      }
      return res;
    });

    Patcher.after(UserStore, 'getCurrentUser', (self, args, res) => {
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

    // Bio / About Me
    const UserProfileStore = getByProps('getUserProfile', 'getProfiles');
    if (UserProfileStore) {
      Patcher.after(UserProfileStore, 'getUserProfile', (self, [id], res) => {
        if (res && id === currentUserId) {
          res.bio = CUSTOM_BIO;
        }
        return res;
      });
    }

    // Display name / nickname
    const GuildMemberStore = getByProps('getMember', 'getMembers');
    if (GuildMemberStore) {
      Patcher.after(GuildMemberStore, 'getMember', (self, [guildId, userId], res) => {
        if (res && userId === currentUserId) {
          res.nick = CUSTOM_NICK;
        }
        return res;
      });
    }
  },

  onStop() {
    Patcher.unpatchAll();
  }
};

registerPlugin(FullProfileSpoofer);
