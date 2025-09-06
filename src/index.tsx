import manifest from '../manifest.json';
import { Plugin, registerPlugin } from 'enmity/managers/plugins';
import { bulk, filters } from 'enmity/metro';

// Hard-coded values
const NEW_USERNAME = 'MyFakeName';
const NEW_NICKNAME = 'LocalNick';
const NEW_AVATAR_HASH = 'b23c9146bbfafea6501dcf6d33197731'; // replace with your avatar hash
const AVATAR_IS_GIF = false;

const [UserStore, GuildMemberStore] = bulk(
  filters.byProps('getCurrentUser', 'getUser'),
  filters.byProps('getMember', 'getMembers')
);

let originalGetUser: any;
let originalGetCurrentUser: any;
let originalGetMember: any;

// Helper to generate avatar URL
const getAvatarUrl = (userId: string, hash: string) =>
  `https://cdn.discordapp.com/avatars/${userId}/${hash}${AVATAR_IS_GIF ? '.gif' : '.png'}?size=1024`;

const LocalIdentitySpoofer: Plugin = {
  ...manifest,

  onStart() {
    if (!UserStore || !GuildMemberStore) return;

    // Wait until getCurrentUser() returns a valid user
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
        return {
          ...res,
          username: NEW_USERNAME,
          avatar: NEW_AVATAR_HASH,
          getAvatarURL: () => getAvatarUrl(currentUserId, NEW_AVATAR_HASH)
        };
      };

      // Patch getUser
      originalGetUser = UserStore.getUser;
      UserStore.getUser = (...args: any[]) => {
        const res = originalGetUser?.apply(UserStore, args);
        if (!res) return res;
        if (args[0] === currentUserId) {
          return {
            ...res,
            username: NEW_USERNAME,
            avatar: NEW_AVATAR_HASH,
            getAvatarURL: () => getAvatarUrl(currentUserId, NEW_AVATAR_HASH)
          };
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

      console.log('[LocalIdentitySpoofer] Username, nickname, and avatar patched safely.');
    }, 100);
  },

  onStop() {
    if (originalGetCurrentUser) UserStore.getCurrentUser = originalGetCurrentUser;
    if (originalGetUser) UserStore.getUser = originalGetUser;
    if (originalGetMember) GuildMemberStore.getMember = originalGetMember;

    console.log('[LocalIdentitySpoofer] Plugin stopped and patches removed.');
  }
};

registerPlugin(LocalIdentitySpoofer);
