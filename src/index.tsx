import manifest from '../manifest.json';
import { Plugin, registerPlugin } from 'enmity/managers/plugins';
import { bulk, filters } from 'enmity/metro';

const NEW_USERNAME = 'MyFakeName';
const NEW_NICKNAME = 'LocalNick';

const [UserStore, GuildMemberStore, UserProfileStore] = bulk(
  filters.byProps('getCurrentUser', 'getUser'),
  filters.byProps('getMember', 'getMembers'),
  filters.byProps('getUserProfile', 'getProfiles')
);

let originalGetUser: any;
let originalGetCurrentUser: any;
let originalGetMember: any;
let originalGetUserProfile: any;

const LocalIdentitySpoofer: Plugin = {
  ...manifest,

  onStart() {
    if (!UserStore || !GuildMemberStore || !UserProfileStore) return;

    const interval = setInterval(() => {
      const currentUser = UserStore.getCurrentUser?.();
      if (!currentUser) return;
      clearInterval(interval);

      const currentUserId = currentUser.id;

      // Patch getCurrentUser
      originalGetCurrentUser = UserStore.getCurrentUser;
      UserStore.getCurrentUser = (...args: any[]) => {
        const res = originalGetCurrentUser?.apply(UserStore, args);
        if (!res) return res;
        return { ...res, username: NEW_USERNAME };
      };

      // Patch getUser
      originalGetUser = UserStore.getUser;
      UserStore.getUser = (...args: any[]) => {
        const res = originalGetUser?.apply(UserStore, args);
        if (!res) return res;
        if (args[0] === currentUserId) {
          return { ...res, username: NEW_USERNAME };
        }
        return res;
      };

      // Patch getMember for nickname
      originalGetMember = GuildMemberStore.getMember;
      GuildMemberStore.getMember = (guildId: string, userId: string) => {
        const member = originalGetMember?.call(GuildMemberStore, guildId, userId);
        if (!member) return member;
        if (userId === currentUserId) {
          return { ...member, nick: NEW_NICKNAME };
        }
        return member;
      };

      // Patch UserProfileStore for display name in UI
      originalGetUserProfile = UserProfileStore.getUserProfile;
      UserProfileStore.getUserProfile = (_self: any, [userId]: any) => {
        const profile = originalGetUserProfile?.call(UserProfileStore, _self, [userId]);
        if (!profile) return profile;
        if (userId === currentUserId) {
          return { ...profile, globalName: NEW_USERNAME };
        }
        return profile;
      };

      console.log('[LocalIdentitySpoofer] Username and display name patched safely.');
    }, 100);
  },

  onStop() {
    if (originalGetCurrentUser) UserStore.getCurrentUser = originalGetCurrentUser;
    if (originalGetUser) UserStore.getUser = originalGetUser;
    if (originalGetMember) GuildMemberStore.getMember = originalGetMember;
    if (originalGetUserProfile) UserProfileStore.getUserProfile = originalGetUserProfile;

    console.log('[LocalIdentitySpoofer] Plugin stopped and patches removed.');
  }
};

registerPlugin(LocalIdentitySpoofer);
