import { Plugin, Patcher, Toasts, Data } from 'enmity/managers';
import { getByProps } from 'enmity/metro';
import { buildSettingsPanel, SettingsSwitch, SettingsText } from 'enmity/ui/settings';

export default class Imposter extends Plugin {
    settings = {
        active: true,
        subjectUserId: '',
        targetUserId: ''
    };

    UserStore = getByProps('getUser', 'getCurrentUser');
    UserProfileStore = getByProps('getUserProfile');
    PresenceStore = getByProps('getPrimaryActivity');
    GuildMemberStore = getByProps('getMember');

    start() {
        this.loadSettings();
        if (this.settings.active) this.loadPatches();
        Toasts.show('Imposter plugin started (client-side only).');
    }

    stop() {
        Patcher.unpatchAll();
        Toasts.show('Imposter plugin stopped.');
    }

    loadPatches() {
        Patcher.after('spoof-user', this.UserStore, 'getUser', (_, [id], res) => {
            if (id === this.settings.targetUserId) {
                const subject = this.UserStore.getUser(this.settings.subjectUserId);
                return { ...res, username: subject.username, avatar: subject.avatar, globalName: subject.globalName };
            }
        });

        Patcher.after('spoof-user-profile', this.UserProfileStore, 'getUserProfile', (_, [id], res) => {
            if (id === this.settings.targetUserId) {
                const subject = this.UserProfileStore.getUserProfile(this.settings.subjectUserId);
                return { ...res, badges: subject.badges, bio: subject.bio, pronouns: subject.pronouns, themeColor: subject.themeColor };
            }
        });

        Patcher.after('spoof-user-status', this.PresenceStore, 'getPrimaryActivity', (_, [id], res) => {
            if (id === this.settings.targetUserId) {
                return this.PresenceStore.getPrimaryActivity(this.settings.subjectUserId) || res;
            }
        });

        Patcher.after('spoof-user-guild', this.GuildMemberStore, 'getMember', (_, [guildId, id], res) => {
            if (id === this.settings.targetUserId) {
                const subject = this.GuildMemberStore.getMember(guildId, this.settings.subjectUserId);
                return { ...res, nick: subject?.nick || res.nick };
            }
        });
    }

    loadSettings() {
        const saved = Data.load('Imposter', 'settings') || {};
        this.settings = { ...this.settings, ...saved };
    }

    saveSettings() {
        Data.save('Imposter', 'settings', this.settings);
        Patcher.unpatchAll();
        if (this.settings.active) this.loadPatches();
    }

    getSettingsPanel() {
        return buildSettingsPanel(
            SettingsSwitch({
                name: 'Active',
                note: 'Enable the plugin',
                value: this.settings.active,
                onValueChange: (val: boolean) => { this.settings.active = val; this.saveSettings(); }
            }),
            SettingsText({
                name: 'Subject User ID',
                note: 'User to copy identity from',
                value: this.settings.subjectUserId,
                placeholder: 'User ID',
                onValueChange: (val: string) => { this.settings.subjectUserId = val; this.saveSettings(); }
            }),
            SettingsText({
                name: 'Target User ID',
                note: 'User to copy identity to (client-side only)',
                value: this.settings.targetUserId,
                placeholder: 'User ID',
                onValueChange: (val: string) => { this.settings.targetUserId = val; this.saveSettings(); }
            })
        );
    }
}
