import manifest from '../manifest.json';
import { Plugin, registerPlugin } from 'enmity/managers/plugins';
import { React } from 'enmity/metro/common';
import { bulk, filters } from 'enmity/metro';
import Settings from './components/Settings';
import { Data } from 'enmity/managers';

const [UserStore, GuildMemberStore] = bulk(
  filters.byProps('getCurrentUser'),
  filters.byProps('getMember', 'getMembers')
);

let originalGetMember: any;

let currentSettings = {
  active: true,
  nickname: ''
};

const NicknamePlugin: Plugin = {
  ...manifest,

  onStart() {
    const saved = Data.load('NicknamePlugin', 'settings') || {};
    currentSettings = { ...currentSettings, ...saved };

    if (!UserStore || !GuildMemberStore) return;
    const currentUserId = UserStore.getCurrentUser()?.id;
    if (!currentUserId) return;

    originalGetMember = GuildMemberStore.getMember;

    // Patch getMember to override nick
    GuildMemberStore.getMember = (guildId: string, userId: string) => {
      const member = originalGetMember.call(GuildMemberStore, guildId, userId);
      if (currentSettings.active && userId === currentUserId) {
        return { ...member, nick: currentSettings.nickname || member.nick };
      }
      return member;
    };

    console.log('[NicknamePlugin] Local nickname patch applied.');
  },

  onStop() {
    if (originalGetMember) {
      GuildMemberStore.getMember = originalGetMember;
    }
    console.log('[NicknamePlugin] Plugin stopped.');
  },

  getSettingsPanel({ settings }) {
    return <Settings settings={settings} />;
  }
};

registerPlugin(NicknamePlugin);
