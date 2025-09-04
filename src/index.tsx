import { registerPlugin } from "@enmity/api/plugin";
import { Dialog } from "@enmity/components";
import { getUser } from "@enmity/api/user";

registerPlugin({
  name: "AvatarClone",
  description: "Set your local profile avatar to someone else's by Discord ID.",
  version: "1.0.0",
  authors: ["clockwrks"],

  onStart() {
    Dialog.show({
      title: "Clone Avatar",
      body: "Enter Discord User ID:",
      buttons: [
        {
          text: "Set Avatar",
          onClick: async (input: string) => {
            const user = await getUser(input);
            if (user && user.avatar) {
              const avatarUrl = `https://cdn.discordapp.com/avatars/${input}/${user.avatar}.png`;
              // Use Enmity API to swap your own avatar locally
              // Example placeholder - Enmity's real API may differ!
              window.enmity.setLocalAvatar(avatarUrl);
            } else {
              Dialog.show({ title: "Error", body: "Invalid user ID or no avatar found." });
            }
          },
        },
      ],
      input: true,
    });
  },

  onStop() {
    // Optionally reset avatar
    window.enmity.setLocalAvatar(null);
  },
});
