import manifest from '../manifest.json';
import { Plugin, registerPlugin } from 'enmity/managers/plugins';
import { bulk, filters } from 'enmity/metro';

const [UserStore, GuildMemberStore] = bulk(
  filters.byProps('getCurrentUser'),
  filters.byProps('getMember', 'getMembers')
);

const NicknamePlugin: Plugin = {
  ...manifest,

  onStart() {
    // Patch GuildMemberStore locally to override your nick
    const currentUserId = UserStore.getCurrentUser()?.id;

    if (currentUserId && GuildMemberStore) {
      const originalGetMember = GuildMemberStore.getMember;
      GuildMemberStore.getMember = (guildId: string, userId: string) => {
        const member = originalGetMember.call(GuildMemberStore, guildId, userId);
        if (userId === currentUserId) {
          return { ...member, nick: 'works' }; // Local override
        }
        return member;
      };
      console.log('NicknamePlugin started: local nickname overridden.');
    }
  },

  onStop() {
    // Cleanup would restore original methods if needed
    console.log(`The '${manifest.name}' plugin has been unloaded.`);
  }
};

registerPlugin(NicknamePlugin);
