import { registerPlugin } from "@enmity/api/plugin";
import { Dialog } from "@enmity/components";
import { getUser } from "@enmity/api/user";
import { Settings } from "@enmity/api/settings";

registerPlugin({
  name: "AvatarClone",
  description: "Change your local profile avatar to another user's by Discord ID.",
  version: "1.0.0",
  authors: ["yourName"],

  settings: Settings.section("AvatarClone", [
    Settings.button("Clone Avatar", "Set your avatar to someone else's", () => {
      Dialog.show({
        title: "Clone Avatar",
        body: "Enter Discord User ID:",
        buttons: [
          {
            text: "Set Avatar",
            onClick: async (input: string) => {
              try {
                const user = await getUser(input);
                if (user && user.avatar) {
                  const avatarUrl = `https://cdn.discordapp.com/avatars/${input}/${user.avatar}.png`;
                  // Swap avatar locally. Replace with Enmity's real API if needed.
                  window.enmity.setLocalAvatar(avatarUrl);
                } else {
                  Dialog.show({ title: "Error", body: "User ID not found or no avatar." });
                }
              } catch {
                Dialog.show({ title: "Error", body: "API error or invalid input." });
              }
            }
          }
        ],
        input: true
      });
    })
  ]),

  onStart() {}, // No automatic dialog on plugin load

  onStop() {
    window.enmity.setLocalAvatar(null);
  },
});
