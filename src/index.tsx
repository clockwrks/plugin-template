import { Plugin, registerPlugin } from 'enmity/managers/plugins'
import { create } from 'enmity/patcher'
import { getByProps } from 'enmity/metro'

import manifest from '../manifest.json'

const Patcher = create('Imposter')

// Hardcode the user ID you want to copy
const TARGET_USER_ID = '748092773579882597'

const Imposter: Plugin = {
  ...manifest,

  onStart() {
    const UserStore = getByProps('getCurrentUser', 'getUser')
    const currentUser = UserStore.getCurrentUser()
    if (!currentUser) return

    const currentUserId = currentUser.id
    const targetUser = UserStore.getUser(TARGET_USER_ID)
    if (!targetUser) {
      console.log('[Imposter] Target user not cached yet, open their profile once.')
      return
    }

    // Patch getUser so when it returns *you*, it looks like the target
    Patcher.after(UserStore, 'getUser', (self, args, res) => {
      if (res?.id === currentUserId) {
        return { ...res, avatar: targetUser.avatar }
      }
      return res
    })

    // Patch getCurrentUser the same way
    Patcher.after(UserStore, 'getCurrentUser', (self, args, res) => {
      if (res?.id === currentUserId) {
        return { ...res, avatar: targetUser.avatar }
      }
      return res
    })
  },

  onStop() {
    Patcher.unpatchAll()
  }
}

registerPlugin(Imposter)
