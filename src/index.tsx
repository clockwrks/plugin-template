import { Plugin, registerPlugin } from "enmity/managers/plugins";
import { bulk, filters } from "enmity/metro";

const [UserStore, UserProfileStore, PresenceStore] = bulk(
  filters.byProps("getUser", "getUserProfile", "getPrimaryActivity")
);

let patches = [];

const impostorPlugin = {
  ...manifest,
  onStart() {
    if (!UserStore || !UserProfileStore || !PresenceStore) return;

    const subjectId = "748092773579882597"; // copy from
    const targetId = "383296127396610049";  // spoofed user

    // Cache the subject's profile once
    const subjectProfile = UserProfileStore.getUserProfile(subjectId);
    const subjectUser = UserStore.getUser(subjectId);

    // Patch getUserProfile safely
    patches.push(
      UserProfileStore.patch("getUserProfile", (args, res) => {
        if (args[0] === targetId && subjectProfile) {
          // merge fields, don't return undefined
          return { ...res, ...subjectProfile };
        }
        return res;
      })
    );

    // Patch getUser
    patches.push(
      UserStore.patch("getUser", (args, res) => {
        if (res?.id === targetId && subjectUser) {
          return { ...res, ...subjectUser };
        }
        return res;
      })
    );

    // Patch presence (optional)
    patches.push(
      PresenceStore.patch("getPrimaryActivity", (args, res) => {
        if (args[0] === targetId && subjectProfile?.presence) {
          return subjectProfile.presence;
        }
        return res;
      })
    );
  },

  onStop() {
    patches.forEach(unpatch => unpatch());
    patches = [];
  }
};

registerPlugin(impostorPlugin);
