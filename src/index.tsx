import { Plugin, registerPlugin } from 'enmity/managers/plugins';
import { create } from 'enmity/patcher';
import { React, REST } from 'enmity/metro/common';
import { getByProps } from 'enmity/metro';
import { get } from "enmity/api/settings";

import manifest, { name as plugin_name } from '../manifest.json';
import Settings from "./components/Settings";

const Patcher = create(manifest.name);

const AvatarChanger: Plugin = {
   ...manifest,

   onStart() {
      // Find the UserStore and User module using their known properties
      const { UserStore } = getByProps('getCurrentUser', 'getUsers');
      const User = getByProps('getUserAvatarURL', 'isBot');
      
      const currentUserId = UserStore?.getCurrentUser()?.id;
      const targetUserId = get(plugin_name, "targetUserId", "");

      // Ensure necessary modules are found and the user ID is valid
      if (!User || !currentUserId) {
          console.error("AvatarChanger: Required modules or user ID not found.");
          return;
      }

      // If a target user ID is set in the settings, apply the patch
      if (targetUserId) {
         Patcher.instead(User, 'getUserAvatarURL', (self, [user], originalMethod) => {
            // Only apply the patch to the current user's avatar
            if (user.id === currentUserId) {
               // The original avatar hash is still needed to construct the URL
               const avatarHash = user.avatar;
               return `https://cdn.discordapp.com/avatars/${targetUserId}/${avatarHash}.png`;
            } else {
               // Return the original method for all other users
               return originalMethod(user);
            }
         });
      }
   },

   onStop() {
      Patcher.unpatchAll();
   },

   getSettingsPanel({ settings }) {
      return <Settings settings={settings} />;
   }
};

registerPlugin(AvatarChanger);
