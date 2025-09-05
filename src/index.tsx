// index.tsx
import { Patcher } from '@enmity/patcher';
import { findByProps } from '@enmity/metro';

const SUBJECT_ID = '378986339007201290'; // user to copy (source)
const TARGET_ID = '1388444223610556589';  // user to display as spoofed (target)
const WATERMARK = ' (LOCAL SPOOF)';

export default {
  onStart() {
    try {
      const UserStore = findByProps('getCurrentUser', 'getUser');
      const UserProfileStore = findByProps('getUserProfile', 'getMutualGuilds');
      const PresenceStore = findByProps('getPrimaryActivity', 'getActivitiesForUser');
      const GuildMemberStore = findByProps('getMember', 'getMembers');

      if (UserStore) {
        Patcher.after('imposter:user-getUser', UserStore, 'getUser', (thisObj, args, res) => {
          if (!res) return res;
          const id = (args && args[0]) || res.id;
          if (String(id) === String(TARGET_ID)) {
            const subject = UserStore.getUser(String(SUBJECT_ID));
            if (!subject) return res;
            // shallow clone and override visible fields, append watermark
            const spoof = Object.create(res);
            spoof.username = (subject.username || res.username) + WATERMARK;
            spoof.avatar = subject.avatar || res.avatar;
            spoof.banner = subject.banner || res.banner;
            spoof.globalName = subject.globalName ? subject.globalName + WATERMARK : subject.globalName;
            // keep id as target so client still treats this as the same user in logic
            spoof.id = res.id;
            return spoof;
          }
          return res;
        });
      }

      if (UserProfileStore) {
        Patcher.after('imposter:userprofile-getUserProfile', UserProfileStore, 'getUserProfile', (thisObj, args, res) => {
          if (!res) return res;
          const id = args && args[0];
          if (String(id) === String(TARGET_ID)) {
            const subjectProfile = UserProfileStore.getUserProfile(String(SUBJECT_ID));
            if (!subjectProfile) return res;
            const spoofProfile = Object.create(res);
            spoofProfile.badges = subjectProfile.badges || res.badges;
            spoofProfile.bio = (subjectProfile.bio || res.bio || '') + ' [LOCAL SPOOF]';
            spoofProfile.profileEffectId = subjectProfile.profileEffectId || res.profileEffectId;
            spoofProfile.pronouns = subjectProfile.pronouns || res.pronouns;
            spoofProfile.themeColor = subjectProfile.themeColor || res.themeColor;
            return spoofProfile;
          }
          return res;
        });

        Patcher.after('imposter:userprofile-getMutualGuilds', UserProfileStore, 'getMutualGuilds', (thisObj, args, res) => {
          if (!args) return res;
          const id = args[0];
          if (String(id) === String(TARGET_ID)) {
            const data = UserProfileStore.getMutualGuilds(String(SUBJECT_ID));
            return data || res;
          }
          return res;
        });
      }

      if (PresenceStore) {
        Patcher.after('imposter:presence-getPrimaryActivity', PresenceStore, 'getPrimaryActivity', (thisObj, args, res) => {
          if (!args) return res;
          const id = args[0];
          if (String(id) === String(TARGET_ID)) {
            const data = PresenceStore.getPrimaryActivity(String(SUBJECT_ID));
            // Optionally annotate activity; keep as-is but safe
            return data || res;
          }
          return res;
        });
      }

      if (GuildMemberStore) {
        Patcher.after('imposter:guildmember-getMember', GuildMemberStore, 'getMember', (thisObj, args, res) => {
          if (!args) return res;
          // args: (guildId, userId)
          const guildId = args[0];
          const id = args[1];
          if (String(id) === String(TARGET_ID)) {
            const subjectMember = GuildMemberStore.getMember(guildId, String(SUBJECT_ID));
            const subjectUser = UserStore.getUser(String(SUBJECT_ID));
            if (!subjectUser) return res;
            const spoofMember = Object.create(res);
            spoofMember.nick = subjectMember && subjectMember.nick ? subjectMember.nick + WATERMARK : (subjectUser.globalName ? subjectUser.globalName + WATERMARK : subjectUser.username + WATERMARK);
            return spoofMember;
          }
          return res;
        });
      }

      // Optional: patch message author display, to ensure watermark in message headers
      // Attempt to find message header component props
      const MessageHeader = findByProps('Author', 'Timestamp'); // best-effort, may vary by build
      if (MessageHeader && MessageHeader.Author) {
        Patcher.after('imposter:message-author', MessageHeader, 'Author', (thisObj, args, res) => {
          // This is best-effort; if structure differs, skip
          try {
            if (res && res.props && res.props.message && res.props.message.author && String(res.props.message.author.id) === String(TARGET_ID)) {
              // mutate displayed username prop if present
              if (res.props.message.author.username && !res.props.message.author.username.includes(WATERMARK)) {
                res.props.message.author.username = String(res.props.message.author.username) + WATERMARK;
              }
            }
          } catch (e) {
            // ignore
          }
          return res;
        });
      }
    } catch (err) {
      // if anything fails, ensure we don't crash the client
      // Enmity provides console; we keep this minimal
      // console.error && console.error('Imposter (local) failed to start:', err);
    }
  },

  onStop() {
    try {
      Patcher.unpatchAll('imposter:user-getUser');
      Patcher.unpatchAll('imposter:userprofile-getUserProfile');
      Patcher.unpatchAll('imposter:userprofile-getMutualGuilds');
      Patcher.unpatchAll('imposter:presence-getPrimaryActivity');
      Patcher.unpatchAll('imposter:guildmember-getMember');
      Patcher.unpatchAll('imposter:message-author');
      Patcher.unpatchAll('imposter');
    } catch (e) {
      // ignore
    }
  },
};
