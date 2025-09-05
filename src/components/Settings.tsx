import { FormRow, FormSection, FormInput, ScrollView, Text } from 'enmity/components';
import { Constants, StyleSheet, Linking } from 'enmity/metro/common';
// @ts-ignore
import { version } from '../../manifest.json';
import { getIDByName } from "enmity/api/assets";

const GitHubIcon = getIDByName('img_account_sync_github_white');

export default ({ settings }: { settings: any }) => {
   const styles = StyleSheet.createThemedStyleSheet({
      footer: {
         color: Constants.ThemeColorMap.HEADER_SECONDARY,
         textAlign: 'center',
         paddingTop: 10,
         paddingBottom: 20
      }
   });

   return (
      <ScrollView>
         <FormSection title="AVATAR CHANGER SETTINGS">
            <FormInput
               label="Target User ID"
               placeholder="Enter Discord User ID"
               value={settings.get("targetUserId", "")}
               onChange={(value: string) => settings.set("targetUserId", value)}
            />
         </FormSection>
         <FormSection title="INFORMATION">
            <FormRow
               label="Check the Source Code on GitHub"
               trailing={FormRow.Arrow}
               leading={<FormRow.Icon source={GitHubIcon} />}
               onPress={() => {
                  Linking.openURL("https://github.com/SerStars/HideMessageShortcuts");
               }}
            />
         </FormSection>
         <Text style={styles.footer}>{`v${version}`}</Text>
      </ScrollView>
   );
};
