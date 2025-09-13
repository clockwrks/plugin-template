import { Plugin, registerPlugin } from "enmity/managers/plugins";
import { bulk, filters } from "enmity/metro";

// Find stores
const [UserStore, UserProfileStore, PresenceStore] = bulk(
  filters.byProps("getUser", "getUserProfile", "getPrimaryActivity")
);

let patches = [];

const impostorPlugin = {
  ...manifest,
  onStart() {
    if (!UserStore || !UserProfileStore || !PresenceStore) return;

    const subjectId = "383296127396610049";  // Replace with source user
    const targetId = "748092773579882597"; // Replace with target user

    // Patch getUser
    patches.push(UserStore.patch("getUser", (args, res) => {
      if (res?.id === targetId) {
        const subject = UserStore.getUser(subjectId);
        if (subject) return { ...res, ...subject };
      }
    }));

    // Patch getUserProfile
    patches.push(UserProfileStore.patch("getUserProfile", (args, res) => {
      if (args[0] === targetId) {
        return UserProfileStore.getUserProfile(subjectId) ?? res;
      }
    }));

    // Patch presence
    patches.push(PresenceStore.patch("getPrimaryActivity", (args, res) => {
      if (args[0] === targetId) {
        return PresenceStore.getPrimaryActivity(subjectId) ?? res;
      }
    }));
  },
  onStop() {
    patches.forEach(unpatch => unpatch());
    patches = [];
  }
};

registerPlugin(impostorPlugin);
