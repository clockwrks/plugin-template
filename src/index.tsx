// index.tsx
import { Patcher } from '@enmity/patcher';
import { findByProps } from '@enmity/metro';

const SUBJECT_ID = '1388444223610556589'; // edit -> the user to copy
const TARGET_ID  = '378986339007201290'; // edit -> the user to appear spoofed
const WATERMARK   = ' [LOCAL SPOOF]';
const CHECK_INTERVAL = 2000;

let checker: number | null = null;
let patchesApplied = false;

export default {
  onStart() {
    console.log('[Imposter(local)] starting');
    const UserStore = findByProps('getUser', 'getCurrentUser');
    const UserProfileStore = findByProps('getUserProfile', 'getMutualGuilds');
    const PresenceStore = findByProps('getPrimaryActivity', 'getActivitiesForUser');
    const GuildMemberStore = findByProps('getMember', 'getMembers');

    if (!UserStore) {
      console.warn('[Imposter(local)] UserStore not found — plugin cannot run');
      return;
    }

    const tryApply = () => {
      const subject = UserStore.getUser(String(SUBJECT_ID));
      const target = UserStore.getUser(String(TARGET_ID));
      if (!subject || !target) {
        console.log('[Imposter(local)] waiting for cache. subjectCached:', !!subject, ' targetCached:', !!target);
        return false;
      }
      if (!patchesApplied) {
        applyPatches(UserStore, UserProfileStore, PresenceStore, GuildMemberStore);
        patchesApplied = true;
        console.log('[Imposter(local)] patches applied — subject:', subject.username, ' target:', target.username);
      }
      return true;
    };

    if (!tryApply()) {
      checker = setInterval(() => {
        if (tryApply() && checker) {
          clearInterval(checker);
          checker = null;
        }
      }, CHECK_INTERVAL) as unknown as number;
      console.log('[Imposter(local)] plugin will apply when both users appear in cache. Open their profiles or view their messages.');
    }
  },

  onStop() {
    try {
      Patcher.unpatchAll('imposter');
      Patcher.unpatchAll('imposter:user-getUser');
      Patcher.unpatchAll('imposter:userprofile-getUserProfile');
      Patcher.unpatchAll('imposter:userprofile-getMutualGuilds');
      Patcher.unpatchAll('imposter:presence-getPrimaryActivity');
      Patcher.unpatchAll('imposter:guildmember-getMember');
    } catch (e) { /* ignore */ }
    if (checker) { clearInterval(checker); checker = null; }
    patchesApplied = false;
    console.log('[Imposter(local)] stopped and unpatched');
  }
};

function applyPatches(UserStore, UserProfileStore, PresenceStore, GuildMemberStore) {
  // User info
  Patcher.after('imposter:user-getUser', UserStore, 'getUser', (that, args, res) => {
    if (!res) return res;
    const idArg = args && args[0];
    const id = idArg ? String(idArg) : String(res.id);
    if (id !== String(TARGET_ID)) return res;
    const subject = UserStore.getUser(String(SUBJECT_ID));
    if (!subject) return res;
    const spoof = { ...res };
    spoof.username = (subject.username ?? res.username) + WATERMARK;
    spoof.avatar = subject.avatar ?? res.avatar;
    spoof.banner = subject.banner ?? res.banner;
    spoof.globalName = subject.globalName ? subject.globalName + WATERMARK : res.globalName;
    return spoof;
  });

  // Profile (bio, badges...)
  if (UserProfileStore) {
    Patcher.after('imposter:userprofile-getUserProfile', UserProfileStore, 'getUserProfile', (that, args, res) => {
      if (!res) return res;
      const id = args && args[0];
      if (String(id) !== String(TARGET_ID)) return res;
      const subjProfile = UserProfileStore.getUserProfile(String(SUBJECT_ID));
      if (!subjProfile) return res;
      const spoofProfile = { ...res };
      spoofProfile.badges = subjProfile.badges ?? res.badges;
      spoofProfile.bio = (subjProfile.bio ?? res.bio ?? '') + WATERMARK;
      spoofProfile.profileEffectId = subjProfile.profileEffectId ?? res.profileEffectId;
      spoofProfile.pronouns = subjProfile.pronouns ?? res.pronouns;
      spoofProfile.themeColor = subjProfile.themeColor ?? res.themeColor;
      return spoofProfile;
    });

    Patcher.after('imposter:userprofile-getMutualGuilds', UserProfileStore, 'getMutualGuilds', (that, args, res) => {
      if (!args) return res;
      const id = args[0];
      if (String(id) !== String(TARGET_ID)) return res;
      const data = UserProfileStore.getMutualGuilds(String(SUBJECT_ID));
      return data || res;
    });
  }

  // Presence (status)
  if (PresenceStore) {
    Patcher.after('imposter:presence-getPrimaryActivity', PresenceStore, 'getPrimaryActivity', (that, args, res) => {
      if (!args) return res;
      const id = args[0];
      if (String(id) !== String(TARGET_ID)) return res;
      const data = PresenceStore.getPrimaryActivity(String(SUBJECT_ID));
      return data || res;
    });
  }

  // Guild member (nickname)
  if (GuildMemberStore) {
    Patcher.after('imposter:guildmember-getMember', GuildMemberStore, 'getMember', (that, args, res) => {
      if (!args) return res;
      const guildId = args[0];
      const id = args[1];
      if (String(id) !== String(TARGET_ID)) return res;
      const subjMember = GuildMemberStore.getMember(guildId, String(SUBJECT_ID));
      const subjUser = UserStore.getUser(String(SUBJECT_ID));
      if (!subjUser) return res;
      const spoofMember = { ...res };
      spoofMember.nick = (subjMember && subjMember.nick ? subjMember.nick : subjUser.globalName ?? subjUser.username) + WATERMARK;
      return spoofMember;
    });
  }
}
