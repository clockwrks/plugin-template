import { findByProps, findByStore } from "@enmity-mod/api";

const GuildStore = findByStore("GuildStore");
const UserStore = findByStore("UserStore");

const UserProfileActions = findByProps("updateUserProfile", "updateProfile");
const NicknameActions = findByProps("changeNickname");

export const onLoad = () => {
  const currentUserId = UserStore.getCurrentUser().id;
  const currentGuildId = GuildStore.getGuildId();

  if (currentUserId && currentGuildId) {
    NicknameActions.changeNickname(
      currentGuildId,
      currentUserId,
      'works'
    )
     .then(() => {
        console.log("Nickname successfully changed to 'works'.");
      })
     .catch((error) => {
        console.error("Failed to change nickname:", error);
      });
  }
};

export const onUnload = () => {
  // No cleanup is necessary for this simple plugin.
  console.log("The 'works' plugin has been unloaded.");
};