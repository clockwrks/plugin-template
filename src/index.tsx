import { Plugin, registerPlugin } from "enmity/managers/plugins";
import { bulk, filters } from "enmity/metro";

const [UserStore, UserProfileStore, PresenceStore, GuildMemberStore] = bulk(
  filters.byProps("getUser", "getUserProfile", "getPrimaryActivity", "getMember")
);

let patches = [];

const impostorPlugin = {
  ...manifest,
  onStart() {
    if (!UserStore || !UserProfileStore || !PresenceStore || !GuildMemberStore) return;

    const subjectId = "748092773579882597"; // the user you want to copy
    const targetId = "383296127396610049";  // the user to spoof

    const subjectUser = UserStore.getUser(subjectId);
    const subjectProfile = UserProfileStore.getUserProfile(subjectId);

    // getMember requires a guildId; we’ll patch safely by checking args
    patches.push(GuildMemberStore.patch("getMember", (args, res) => {
      if (args[1] === targetId && subjectUser) {
        const subjectMember = GuildMemberStore.getMember(args[0], subjectId);
        return { ...res, nick: subjectMember?.nick ?? subjectUser.globalName };
      }
      return res;
    }));

    patches.push(UserStore.patch("getUser", (args, res) => {
      if (res?.id === targetId && subjectUser) {
        return { ...res, ...subjectUser };
      }
      return res;
    }));

    patches.push(UserProfileStore.patch("getUserProfile", (args, res) => {
      if (args[0] === targetId && subjectProfile) {
        return { ...res, ...subjectProfile };
      }
      return res;
    }));

    patches.push(PresenceStore.patch("getPrimaryActivity", (args, res) => {
      if (args[0] === targetId && subjectProfile?.presence) {
        return subjectProfile.presence;
      }
      return res;
    }));
  },

  onStop() {
    patches.forEach(p => p());
    patches = [];
  }
};

registerPlugin(impostorPlugin);
