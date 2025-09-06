import { React } from 'enmity/metro/common';
import { buildPanel, SettingsSwitch, SettingsText } from 'enmity/ui/settings';
import { Data } from 'enmity/managers';

interface SettingsProps {
    settings: any;
}

const Settings: React.FC<SettingsProps> = ({ settings }) => {
    // Load current settings
    const currentSettings = { active: true, newUsername: '', ...Data.load('LocalUsernameChanger', 'settings') };

    const saveSettings = (updated: any) => {
        Object.assign(currentSettings, updated);
        Data.save('LocalUsernameChanger', 'settings', currentSettings);
        if (settings?.onChange) settings.onChange('LocalUsernameChanger', 'settings', currentSettings);
    };

    return buildPanel(
        SettingsSwitch({
            name: 'Active',
            note: 'Enable local username override',
            value: currentSettings.active,
            onValueChange: (val: boolean) => saveSettings({ active: val })
        }),
        SettingsText({
            name: 'New Username',
            note: 'Enter your local username',
            value: currentSettings.newUsername,
            placeholder: 'Username',
            onValueChange: (val: string) => saveSettings({ newUsername: val })
        })
    );
};

export default Settings;
