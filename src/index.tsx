import { Plugin, registerPlugin } from 'enmity/managers/plugins';
import { create } from 'enmity/patcher';
import { getByProps } from 'enmity/metro';

import manifest from '../manifest.json';

const Patcher = create('UsernameChanger');

// 🔒 Hardcode the username you want to see
const CUSTOM_USERNAME = 'BetterMe';

const UsernameChanger: Plugin = {
  ...manifest,

  onStart() {
    const { UserStore } = getByProps('getCurrentUser', 'getUser');
    const currentUser = UserStore.getCurrentUser();
    if (!currentUser) return;

    const currentUserId = currentUser.id;

    // Patch getUser
    Patcher.after(UserStore, 'getUser', (self, args, res) => {
      if (res?.id === currentUserId) {
        res.username = CUSTOM_USERNAME; // mutate directly
      }
      return res;
    });

    // Patch getCurrentUser
    Patcher.after(UserStore, 'getCurrentUser', (self, args, res) => {
      if (res?.id === currentUserId) {
        res.username = CUSTOM_USERNAME; // mutate directly
      }
      return res;
    });

    // Also immediately update the cached object
    currentUser.username = CUSTOM_USERNAME;
  },

  onStop() {
    Patcher.unpatchAll();
  }
};

registerPlugin(UsernameChanger);
