import { React } from 'enmity/metro/common';
import { buildPanel, SettingsText, SettingsSwitch } from 'enmity/ui/settings';
import { Data } from 'enmity/managers';

interface SettingsProps {
  settings: any;
}

const Settings: React.FC<SettingsProps> = ({ settings }) => {
  const saved = Data.load('NicknamePlugin', 'settings') || { active: true, nickname: '' };
  const currentSettings = { ...saved };

  const saveSettings = (updated: any) => {
    Object.assign(currentSettings, updated);
    Data.save('NicknamePlugin', 'settings', currentSettings);
    if (settings?.onChange) settings.onChange('NicknamePlugin', 'settings', currentSettings);
  };

  return buildPanel(
    SettingsSwitch({
      name: 'Active',
      note: 'Enable local nickname override',
      value: currentSettings.active,
      onValueChange: (val: boolean) => saveSettings({ active: val })
    }),
    SettingsText({
      name: 'Nickname',
      note: 'Enter your local nickname',
      value: currentSettings.nickname,
      placeholder: 'Nickname',
      onValueChange: (val: string) => saveSettings({ nickname: val })
    })
  );
};

export default Settings;
