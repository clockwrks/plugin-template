import { Plugin, registerPlugin } from 'enmity/managers/plugins';
import { create } from 'enmity/patcher';
import { getByProps } from 'enmity/metro';

import manifest from '../manifest.json';

const Patcher = create('UsernameChanger');

// 🔒 Hardcode the user ID you want to copy
const TARGET_USER_ID = '1286434074495291494';

const UsernameChanger: Plugin = {
  ...manifest,

  onStart() {
    const { UserStore } = getByProps('getCurrentUser', 'getUser');
    const currentUser = UserStore.getCurrentUser();
    if (!currentUser) return;

    const currentUserId = currentUser.id;
    const targetUser = UserStore.getUser(TARGET_USER_ID);

    if (!targetUser) {
      console.log('[UsernameChanger] Target user not cached. Open their profile first.');
      return;
    }

    // Patch getUser so your user object has the target’s username
    Patcher.after(UserStore, 'getUser', (self, args, res) => {
      if (res?.id === currentUserId) {
        return { ...res, username: targetUser.username };
      }
      return res;
    });

    // Patch getCurrentUser the same way
    Patcher.after(UserStore, 'getCurrentUser', (self, args, res) => {
      if (res?.id === currentUserId) {
        return { ...res, username: targetUser.username };
      }
      return res;
    });
  },

  onStop() {
    Patcher.unpatchAll();
  }
};

registerPlugin(UsernameChanger);
