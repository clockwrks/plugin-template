import manifest from '../manifest.json';
import { Plugin, registerPlugin } from 'enmity/managers/plugins';
import { bulk, filters } from 'enmity/metro';

// Hard-coded values
const NEW_USERNAME = 'MyFakeName';
const NEW_NICKNAME = 'LocalNick';

const [UserStore, GuildMemberStore] = bulk(
  filters.byProps('getCurrentUser', 'getUser'),
  filters.byProps('getMember', 'getMembers')
);

let originalGetUser: any;
let originalGetCurrentUser: any;
let originalGetMember: any;

const LocalIdentitySpoofer: Plugin = {
  ...manifest,

  onStart() {
    if (!UserStore || !GuildMemberStore) return;

    const currentUserId = UserStore.getCurrentUser()?.id;
    if (!currentUserId) return;

    // Patch getCurrentUser
    originalGetCurrentUser = UserStore.getCurrentUser;
    UserStore.getCurrentUser = (...args: any[]) => {
      const res = originalGetCurrentUser.apply(UserStore, args);
      if (res) {
        return { ...res, username: NEW_USERNAME };
      }
      return res;
    };

    // Patch getUser
    originalGetUser = UserStore.getUser;
    UserStore.getUser = (...args: any[]) => {
      const res = originalGetUser.apply(UserStore, args);
      if (res && args[0] === currentUserId) {
        return { ...res, username: NEW_USERNAME };
      }
      return res;
    };

    // Patch getMember for nickname
    originalGetMember = GuildMemberStore.getMember;
    GuildMemberStore.getMember = (guildId: string, userId: string) => {
      const member = originalGetMember.call(GuildMemberStore, guildId, userId);
      if (member && userId === currentUserId) {
        return { ...member, nick: NEW_NICKNAME };
      }
      return member;
    };

    console.log('[LocalIdentitySpoofer] Username and nickname patched.');
  },

  onStop() {
    if (originalGetCurrentUser) UserStore.getCurrentUser = originalGetCurrentUser;
    if (originalGetUser) UserStore.getUser = originalGetUser;
    if (originalGetMember) GuildMemberStore.getMember = originalGetMember;

    console.log('[LocalIdentitySpoofer] Plugin stopped and patches removed.');
  }
};

registerPlugin(LocalIdentitySpoofer);
