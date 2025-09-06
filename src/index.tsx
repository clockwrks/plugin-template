import manifest from '../manifest.json';
import { Plugin, registerPlugin } from 'enmity/managers/plugins';
import { React, Dispatcher } from 'enmity/metro/common';
import { bulk, filters } from 'enmity/metro';
import Settings from './components/Settings';
import { Data } from 'enmity/managers';

const [UserStore] = bulk(
  filters.byProps('getCurrentUser', 'getUser')
);

let usernamePatch: any;
let currentSettings = {
  active: true,
  newUsername: ''
};

const LocalUsernameChanger: Plugin = {
  ...manifest,

  onStart() {
    // Load settings
    const saved = Data.load('LocalUsernameChanger', 'settings') || {};
    currentSettings = { ...currentSettings, ...saved };

    // Patch getCurrentUser
    usernamePatch = UserStore.getCurrentUser;
    UserStore.getCurrentUser = (...args: any[]) => {
      const res = usernamePatch.apply(UserStore, args);
      if (currentSettings.active && currentSettings.newUsername) {
        return { ...res, username: currentSettings.newUsername };
      }
      return res;
    };

    // Patch getUser for current user
    usernamePatch = UserStore.getUser;
    UserStore.getUser = (...args: any[]) => {
      const res = usernamePatch.apply(UserStore, args);
      if (currentSettings.active && currentSettings.newUsername &&
          args[0] === UserStore.getCurrentUser()?.id) {
        return { ...res, username: currentSettings.newUsername };
      }
      return res;
    };

    console.log('[LocalUsernameChanger] Plugin started.');
  },

  onStop() {
    if (usernamePatch) {
      UserStore.getCurrentUser = usernamePatch;
      UserStore.getUser = usernamePatch;
    }
    console.log('[LocalUsernameChanger] Plugin stopped.');
  },

  getSettingsPanel({ settings }) {
    return <Settings settings={settings} />;
  }
};

registerPlugin(LocalUsernameChanger);
