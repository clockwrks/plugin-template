import manifest from '../manifest.json';
import { Plugin, registerPlugin } from 'enmity/managers/plugins';
import { bulk, filters } from 'enmity/metro';

const DEFAULT_SETTINGS = {
  active: true,
  subjectUserId: '748092773579882597',
  targetUserId: '378986339007201290'
};

let settings = { ...DEFAULT_SETTINGS };

// Stores
const [UserStore, UserProfileStore, PresenceStore, GuildMemberStore] = bulk(
  filters.byProps('getCurrentUser', 'getUser'),
  filters.byProps('getUserProfile', 'getProfiles'),
  filters.byProps('getPrimaryActivity'),
  filters.byProps('getMember')
);

let originalGetUser: any;
let originalGetUserProfile: any;
let originalGetPrimaryActivity: any;
let originalGetMember: any;

const Imposter: Plugin = {
  ...manifest,

  onStart() {
    if (!settings.active) return;
    if (!UserStore || !UserProfileStore || !PresenceStore || !GuildMemberStore) return;

    const interval = setInterval(() => {
      const currentUser = UserStore.getCurrentUser?.();
      if (!currentUser) return;
      clearInterval(interval);

      const targetId = settings.targetUserId;
      const subjectId = settings.subjectUserId;

      // Patch getUser
      originalGetUser = UserStore.getUser;
      UserStore.getUser = (userId: string) => {
        const res = originalGetUser?.call(UserStore, userId);
        if (!res) return res;
        if (userId === targetId) {
          const subject = UserStore.getUser(subjectId);
          if (!subject) return res;
          return { ...res, username: subject.username, avatar: subject.avatar, banner: subject.banner };
        }
        return res;
      };

      // Patch getUserProfile
      originalGetUserProfile = UserProfileStore.getUserProfile;
      UserProfileStore.getUserProfile = (_self: any, [userId]: any) => {
        const res = originalGetUserProfile?.call(UserProfileStore, _self, [userId]);
        if (!res) return res;
        if (userId === targetId) {
          const subjectProfile = UserProfileStore.getUserProfile(subjectId);
          if (!subjectProfile) return res;
          return { ...res, bio: subjectProfile.bio, badges: subjectProfile.badges, themeColor: subjectProfile.themeColor };
        }
        return res;
      };

      // Patch presence (best-effort)
      originalGetPrimaryActivity = PresenceStore.getPrimaryActivity;
      PresenceStore.getPrimaryActivity = (_self: any, userId: string) => {
        const res = originalGetPrimaryActivity?.call(PresenceStore, _self, userId);
        if (userId === targetId) {
          return PresenceStore.getPrimaryActivity(subjectId) || res;
        }
        return res;
      };

      // Patch guild member
      originalGetMember = GuildMemberStore.getMember;
      GuildMemberStore.getMember = (guildId: string, userId: string) => {
        const member = originalGetMember?.call(GuildMemberStore, guildId, userId);
        if (!member) return member;
        if (userId === targetId) {
          const subjectMember = GuildMemberStore.getMember(guildId, subjectId);
          return { ...member, nick: subjectMember?.nick || member.nick };
        }
        return member;
      };

      console.log('[Imposter] Spoofing applied.');
    }, 100);
  },

  onStop() {
    if (originalGetUser) UserStore.getUser = originalGetUser;
    if (originalGetUserProfile) UserProfileStore.getUserProfile = originalGetUserProfile;
    if (originalGetPrimaryActivity) PresenceStore.getPrimaryActivity = originalGetPrimaryActivity;
    if (originalGetMember) GuildMemberStore.getMember = originalGetMember;

    console.log('[Imposter] Spoofing removed.');
  },

  getSettingsPanel() {
    // Minimal settings panel
    return null;
  }
};

registerPlugin(Imposter);
