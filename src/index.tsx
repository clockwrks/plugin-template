import { Plugin, registerPlugin } from 'enmity/managers/plugins';
import { create } from 'enmity/patcher';
import { bulk, filters } from 'enmity/metro';

const Patcher = create('ProfileSpoofer');

const [
  UserProfileStore
] = bulk(
  filters.byProps('getUserProfile')
);

// ===================== CONFIGURATION =====================
// IMPORTANT: Replace these with the actual user IDs you want to use.
// You can get a user's ID by enabling Discord's "Developer Mode,"
// right-clicking their profile, and selecting "Copy User ID."

const TARGET_USER_ID = '383296127396610049';
const REPLACEMENT_USER_ID = '1117005234301050882';

// =========================================================

const ProfileSpoofer: Plugin = {
  name: 'ProfileSpoofer',
  version: '1.0.0',
  description: 'Redirects a user\'s profile view to another person\'s profile.',
  author: 'Enmity-GPT',
  
  onStart() {
    // Patch the getUserProfile function to redirect the profile view.
    // The "instead" patch completely replaces the original function with our custom logic.
    Patcher.instead(UserProfileStore, 'getUserProfile', (self, args, originalFunction) => {
      // The first argument to getUserProfile is the user ID.
      const userId = args[0];

      // Check if the user ID being fetched matches our target user.
      if (userId === TARGET_USER_ID) {
        // If it's the target user, we call the original function with the
        // replacement user ID instead of the original one.
        console.log(`[ProfileSpoofer] Redirecting profile view for ${TARGET_USER_ID} to ${REPLACEMENT_USER_ID}.`);
        return originalFunction.apply(self, [REPLACEMENT_USER_ID]);
      }
      
      // If it's not the target user, we let the original function run as normal.
      return originalFunction.apply(self, args);
    });

    console.log('[ProfileSpoofer] Plugin started.');
  },

  onStop() {
    // Un-patch all applied patches to prevent memory leaks and other issues.
    Patcher.unpatchAll();
    console.log('[ProfileSpoofer] Plugin stopped.');
  },
};

registerPlugin(ProfileSpoofer);