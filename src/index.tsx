import { Plugin, registerPlugin } from 'enmity/managers/plugins';
import { create } from 'enmity/patcher';
import { getByProps } from 'enmity/metro';

import manifest from '../manifest.json';

const Patcher = create('AvatarChanger');

// 🔒 Hardcode the user ID you want to copy
const TARGET_USER_ID = '1286434074495291494';

const AvatarChanger: Plugin = {
  ...manifest,

  onStart() {
    const { UserStore } = getByProps('getCurrentUser', 'getUsers');
    const currentUser = UserStore.getCurrentUser();
    if (!currentUser) return;

    const currentUserId = currentUser.id;

    const User = getByProps('getUserAvatarURL', 'isBot');
    if (!User) return;

    Patcher.instead(User, 'getUserAvatarURL', (self, [user], orig) => {
      // If the user is you, swap to the target’s avatar
      if (user.id === currentUserId) {
        const targetUser = UserStore.getUser(TARGET_USER_ID);
        if (targetUser?.avatar) {
          return `https://cdn.discordapp.com/avatars/${TARGET_USER_ID}/${targetUser.avatar}.png`;
        }
      }
      // Otherwise leave everything else normal
      return orig(user);
    });
  },

  onStop() {
    Patcher.unpatchAll();
  }
};

registerPlugin(AvatarChanger);
