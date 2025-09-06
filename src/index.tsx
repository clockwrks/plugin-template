import { Plugin, registerPlugin } from 'enmity/managers/plugins';
import { create } from 'enmity/patcher';
import { getByProps } from 'enmity/metro';

import manifest from '../manifest.json';

const Patcher = create('ProfileSpoofer');

// Customize here
const CUSTOM_NAME = 'FakeClock';
const CUSTOM_ABOUT = 'This is a spoofed about me 🚨';

const ProfileSpoofer: Plugin = {
  ...manifest,

  onStart() {
    const { UserStore } = getByProps('getUser', 'getCurrentUser');
    const currentUser = UserStore.getCurrentUser();
    if (!currentUser) return;

    const currentUserId = currentUser.id;

    // Patch getUser globally
    Patcher.after(UserStore, 'getUser', (self, [id], res) => {
      if (res && id === currentUserId) {
        return {
          ...res,
          username: CUSTOM_NAME,
          bio: CUSTOM_ABOUT,
        };
      }
      return res;
    });
  },

  onStop() {
    Patcher.unpatchAll();
  },
};

registerPlugin(ProfileSpoofer);
