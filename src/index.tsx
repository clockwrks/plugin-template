// index.ts
import { Filters, Patcher, Settings } from "@enmity/metro";

// Get Enmity settings components
const { SettingPanel, TextInput } = Settings;

// Find Discord modules for user and avatar utilities
const UserStore = Filters.byProps("getCurrentUser", "getUser");
const IconUtils = Filters.byProps("getUserAvatarURL");

// Plugin class definition
export default class AvatarMirror {
  private targetId: string;

  constructor() {
    // Initialize target ID from saved data or empty
    this.targetId = "";
  }

  onStart() {
    // Load saved target ID from persistent data (if any)
    const saved = this.loadData("targetId", "");
    this.targetId = saved || "";

    // Hook into the function that gets a user's avatar URL
    Patcher.after(IconUtils, "getUserAvatarURL", (thisObject, args, returnValue) => {
      const [user, size, animated] = args;
      const currentUser = UserStore.getCurrentUser();

      // Only intercept if this is the current user and a target ID is set
      if (this.targetId && user.id === currentUser.id) {
        // Try to get the target user object from cache
        const targetUser = UserStore.getUser(this.targetId);
        if (targetUser) {
          // Return the target user's avatar URL instead
          return IconUtils.getUserAvatarURL(targetUser, size, animated);
        }
      }
      // Otherwise, do nothing (use original returnValue)
      return returnValue;
    });
  }

  onStop() {
    // Clean up patches when the plugin is disabled
    Patcher.unpatchAll();
  }

  // Settings panel for entering target user ID
  getSettingsPanel() {
    return SettingPanel.build(() => {
      // Save the target ID when changed
      this.saveData("targetId", this.targetId);
    },
      new TextInput(
        "Target User ID",
        "Discord ID of the user whose avatar to mirror",
        this.targetId,
        (value) => { this.targetId = value; },
        { placeholder: "e.g. 123456789012345678" }
      )
    );
  }
}
