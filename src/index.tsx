import { Plugin, registerPlugin } from 'enmity/managers/plugins';
import { create } from 'enmity/patcher';
import { getByProps } from 'enmity/metro';
import { REST } from 'enmity/metro/common';

import manifest from '../manifest.json';

const Patcher = create('UsernameChanger');

const TARGET_USER_ID = '1286434074495291494';

const UsernameChanger: Plugin = {
  ...manifest,

  async onStart() {
    const { UserStore } = getByProps('getCurrentUser', 'getUser');
    const currentUser = UserStore.getCurrentUser();
    if (!currentUser) return;

    const currentUserId = currentUser.id;

    // Try to get target from cache
    let targetUser = UserStore.getUser(TARGET_USER_ID);

    // If not cached, fetch via REST
    if (!targetUser) {
      try {
        const resp = await REST.get(`/users/${TARGET_USER_ID}`);
        if (resp?.body) {
          targetUser = resp.body;
          console.log('[UsernameChanger] Pulled target user via REST:', targetUser.username);
        }
      } catch (e) {
        console.log('[UsernameChanger] Failed to fetch user:', e);
        return;
      }
    }

    if (!targetUser) return;

    // Patch getUser
    Patcher.after(UserStore, 'getUser', (self, args, res) => {
      if (res?.id === currentUserId) {
        return { ...res, username: targetUser.username };
      }
      return res;
    });

    // Patch getCurrentUser
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
