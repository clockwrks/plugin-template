import { Plugin, registerPlugin } from 'enmity/managers/plugins';
import { create } from 'enmity/patcher';
import { getByProps } from 'enmity/metro';
import manifest from '../manifest.json';

const Patcher = create('FullProfileSpoofer');

// Hardcoded profile values
const CUSTOM_NAME = '50cczip';
const CUSTOM_NICK = '50cczip'; // same as name
const CUSTOM_BIO = 'https://nohello.net/\nMy DMs are always open\nDo NOT DM me for\n- Ingame suggestions\n- Discord suggestions\n- Bug reports';
const CUSTOM_AVATAR_HASH = '64d95fd6056fd65505ac10456b3ebc30.gif'; // can be gif or png
const CUSTOM_BANNER_HASH = 'f1c1fb11dd06c143e9761c837b610041';

const FullProfileSpoofer: Plugin = {
  ...manifest,

  onStart() {
    const UserStore = getByProps('getCurrentUser', 'getUser');
    if (!UserStore) return;
    const currentUser = UserStore.getCurrentUser();
    if (!currentUser) return;
    const currentUserId = currentUser.id;

    // Patch username, avatar, banner
    Patcher.after(UserStore, 'getUser', (self, [id], res) => {
      if (res && id === currentUserId) {
        res.username = CUSTOM_NAME;
        res.avatar = CUSTOM_AVATAR_HASH;
        res.banner = CUSTOM_BANNER_HASH;
      }
      return res;
    });

    Patcher.after(UserStore, 'getCurrentUser', (self, args, res) => {
      if (res && res.id === currentUserId) {
        res.username = CUSTOM_NAME;
        res.avatar = CUSTOM_AVATAR_HASH;
        res.banner = CUSTOM_BANNER_HASH;
      }
      return res;
    });

    currentUser.username = CUSTOM_NAME;
    currentUser.avatar = CUSTOM_AVATAR_HASH;
    currentUser.banner = CUSTOM_BANNER_HASH;

    // Patch bio
    const UserProfileStore = getByProps('getUserProfile', 'getProfiles');
    if (UserProfileStore) {
      Patcher.after(UserProfileStore, 'getUserProfile', (self, [id], res) => {
        if (res && id === currentUserId) {
          res.bio = CUSTOM_BIO;
        }
        return res;
      });
    }

    // Patch display name (nickname)
    const GuildMemberStore = getByProps('getMember', 'getMembers');
    if (GuildMemberStore) {
      Patcher.after(GuildMemberStore, 'getMember', (self, [guildId, userId], res) => {
        if (res && userId === currentUserId) {
          res.nick = CUSTOM_NICK;
        }
        return res;
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
