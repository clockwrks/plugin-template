import { Plugin, registerPlugin } from 'enmity/managers/plugins'
import { create } from 'enmity/patcher'
import { getByProps } from 'enmity/metro'

import manifest from '../manifest.json'

const Patcher = create('AvatarChanger')

// hardcode here
const TARGET_USER_ID = '748092773579882597'  // the user to copy

const AvatarChanger: Plugin = {
  ...manifest,

  onStart() {
    const UserStore = getByProps('getCurrentUser', 'getUsers')
    const currentUser = UserStore?.getCurrentUser?.()
    if (!currentUser) return

    const currentUserId = currentUser.id
    const User = getByProps('getUserAvatarURL', 'isBot')

    if (!User) return

    // patch avatar getter
    Patcher.instead(User, 'getUserAvatarURL', (self, [user], orig) => {
      if (user?.id === currentUserId) {
        // always show the target’s avatar for you
        return `https://cdn.discordapp.com/avatars/${TARGET_USER_ID}/${UserStore.getUser(TARGET_USER_ID)?.avatar}.png`
      }
      return orig(user)
    })
  },

  onStop() {
    Patcher.unpatchAll()
  }
}

registerPlugin(AvatarChanger)
