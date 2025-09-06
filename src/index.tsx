import { Plugin, registerPlugin } from 'enmity/managers/plugins';
import { create } from 'enmity/patcher';
import { getByProps } from 'enmity/metro';
import manifest from '../manifest.json';

const Patcher = create('FullProfileSpoofer');

// Hardcode your spoofed profile values here
const CUSTOM_NAME = '🔥SPOOFED🔥';
const CUSTOM_BIO = 'This is a client-side spoofed profile';
const CUSTOM_AVATAR_HASH = 'abcdef1234567890abcdef1234567890'; // Discord avatar hash (just a placeholder)
const CUSTOM_BANNER_HASH = '1234567890abcdef1234567890abcdef'; // Discord banner hash (placeholder)

const FullProfileSpoofer: Plugin = {
  ...manifest,

  onStart() {
    const UserStore = getByProps('getCurrentUser', 'getUser');
    if (!UserStore) {
      console.log('[FullProfileSpoofer] Failed to find UserStore.');
      return;
    }

    const currentUser = UserStore.getCurrentUser();
    if (!currentUser) {
      console.log('[FullProfileSpoofer] Failed to get current user.');
      return;
    }

    const currentUserId = currentUser.id;

    console.log('[FullProfileSpoofer] Loaded. Spoofing user ID:', currentUserId);

    // Patch getUser globally
    Patcher.after(UserStore, 'getUser', (self, [id], res) => {
      if (res && id === currentUserId) {
        res.username = CUSTOM_NAME;
        res.bio = CUSTOM_BIO;
        res.avatar = CUSTOM_AVATAR_HASH;
        res.banner = CUSTOM_BANNER_HASH;
      }
      return res;
    });

    // Patch getCurrentUser
    Patcher.after(UserStore, 'getCurrentUser', (self, args, res) => {
      if (res && res.id === currentUserId) {
        res.username = CUSTOM_NAME;
        res.bio = CUSTOM_BIO;
        res.avatar = CUSTOM_AVATAR_HASH;
        res.banner = CUSTOM_BANNER_HASH;
      }
      return res;
    });

    // Immediately update cached object
    currentUser.username = CUSTOM_NAME;
    currentUser.bio = CUSTOM_BIO;
    currentUser.avatar = CUSTOM_AVATAR_HASH;
    currentUser.banner = CUSTOM_BANNER_HASH;

    console.log('[FullProfileSpoofer] Spoofing applied.');
  },

  onStop() {
    Patcher.unpatchAll();
    console.log('[FullProfileSpoofer] Stopped, patches removed.');
  }
};

registerPlugin(FullProfileSpoofer);
