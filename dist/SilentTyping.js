import { findByProps } from "@enmity-core/api";
import { inject, uninject } from "@enmity-core/patcher";

const Settings = findByProps("plugin", "settings", "get");
const UserAvatar = findByProps("UserAvatar"); // This is a conceptual name, the actual component name may differ

function getAvatarUrl(userId) {
   // This function would make an API call to Discord to get the user's avatar URL.
   // e.g., using Discord's API endpoint like /users/${userId}.
   return `https://cdn.discordapp.com/avatars/${userId}/...`
}

export default {
   onLoad() {
      // Get the user ID from the plugin settings.
      const settings = Settings.get("AvatarChanger");
      const targetUserId = settings.userId;

      if (!targetUserId) return;

      const newAvatarUrl = getAvatarUrl(targetUserId);

      // Patch the UserAvatar component to use the new URL.
      // This is a conceptual patch and may not work with the actual component.
      inject("AvatarChanger", UserAvatar, "default", (_, args, res) => {
         // This is a simplified example of how you might modify the component's props.
         if (args[0].user.id === "YOUR_OWN_USER_ID") {
            res.props.src = newAvatarUrl;
         }
      });
   },

   onUnload() {
      // Clean up the patch when the plugin is unloaded.
      uninject("AvatarChanger");
   }
};