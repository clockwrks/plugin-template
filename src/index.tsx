import { Plugin, registerPlugin } from 'enmity/managers/plugins';
import { create } from 'enmity/patcher';
import { React, REST } from 'enmity/metro/common';
import { getByProps } from 'enmity/metro';
import { get } from "enmity/api/settings";

import manifest, { name as plugin_name } from '../manifest.json';
import Settings from "./components/Settings";

const Patcher = create('AvatarChanger');

const AvatarChanger: Plugin = {
   ...manifest,

   onStart() {
      // Get the current user's ID
      const { UserStore } = getByProps('getCurrentUser', 'getUsers');
      const currentUser = UserStore.getCurrentUser();
      const currentUserId = currentUser.id;

      // Get the target user ID from plugin settings
      const targetUserId = get(plugin_name, "targetUserId", "");

      if (!targetUserId) {
         return;
      }
      
      // Patch the function that generates the user's avatar URL
      const User = getByProps('getUserAvatarURL', 'isBot');
      if (User) {
         Patcher.instead(User, 'getUserAvatarURL', (self, [user], res) => {
            // Check if the user is the current logged-in user and a target ID is provided
            if (user.id === currentUserId && targetUserId) {
               // Discord's API for getting a user's information
               // In a real-world scenario, you would make an API call to get the hash
               // For this client-side patch, we are using a simplified structure
               const avatarURL = `https://cdn.discordapp.com/avatars/${targetUserId}/${user.avatar}.png`;
               return avatarURL;
            } else {
               // For all other users, return the original avatar URL
               return User.getUserAvatarURL(user);
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
