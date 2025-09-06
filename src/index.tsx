import { Plugin, registerPlugin } from 'enmity/managers/plugins';
import { create } from 'enmity/patcher';
import { getByProps } from 'enmity/metro';

import manifest from '../manifest.json';

const Patcher = create('UsernameChanger');

// 🔒 Hardcode the values you want
const CUSTOM_USERNAME = 'BetterMe';

const UsernameChanger: Plugin = {
  ...manifest,

  onStart() {
    const { UserStore } = getByProps('getCurrentUser', 'getUser');
    const currentUser = UserStore.getCurrentUser();
    console.log(currentUser)
    if (!currentUser) return;

    const currentUserId = currentUser.id;

    // Patch getUser
    Patcher.after(UserStore, 'getUser', (self, args, res) => {
      if (res?.id === currentUserId) {
        return { ...res, username: CUSTOM_USERNAME };
      }
      return res;
    });

    // Patch getCurrentUser
    Patcher.after(UserStore, 'getCurrentUser', (self, args, res) => {
      if (res?.id === currentUserId) {
        return { ...res, username: CUSTOM_USERNAME };
      }
      return res;
    });
  },

  onStop() {
    Patcher.unpatchAll();
  }
};

registerPlugin(UsernameChanger);
