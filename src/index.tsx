import manifest from '../manifest.json';
import { Plugin, registerPlugin } from 'enmity/managers/plugins';
import { bulk, filters } from 'enmity/metro';

const [UserProfileStore] = bulk(
  filters.byProps('getUserProfile', 'getMutualGuilds')
);

const FAKE_BADGES = [
  {
    id: 'early',
    description: 'Early Supporter',
    icon: 'https://discord.com/assets/23e59d799436a73c024819f84ea0b627.svg'
  }
];

let originalGetUserProfile: any;

const BadgeSpoofer: Plugin = {
  ...manifest,

  onStart() {
    if (!UserProfileStore) return;

    originalGetUserProfile = UserProfileStore.getUserProfile;

    UserProfileStore.getUserProfile = (...args: any[]) => {
      const res = originalGetUserProfile?.apply(UserProfileStore, args);
      if (!res) return res;

      const currentUserId = res.userId;
      // Only spoof yourself
      if (currentUserId === UserProfileStore.getCurrentUserId?.()) {
        return {
          ...res,
          badges: [
            ...(res.badges || []),
            ...FAKE_BADGES
          ]
        };
      }

      return res;
    };

    console.log('[BadgeSpoofer] Started and patched safely.');
  },

  onStop() {
    if (originalGetUserProfile) {
      UserProfileStore.getUserProfile = originalGetUserProfile;
    }
    console.log('[BadgeSpoofer] Stopped and restored.');
  }
};

registerPlugin(BadgeSpoofer);
