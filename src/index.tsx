import { Plugin, registerPlugin } from 'enmity/managers/plugins'
import { create } from 'enmity/patcher'
import { getByProps } from 'enmity/metro'
import manifest from '../manifest.json'

const Patcher = create('ProfileSpoofer')

// Hardcoded custom profile
const CUSTOM_NAME = 'CoolerMe'
const CUSTOM_ABOUT = 'This is my fake About Me 😎'

const ProfileSpoofer: Plugin = {
  ...manifest,

  onStart() {
    const { UserStore } = getByProps('getCurrentUser', 'getUser')
    const currentUser = UserStore.getCurrentUser()
    if (!currentUser) return
    const currentUserId = currentUser.id

    // Patch getUser
    Patcher.after(UserStore, 'getUser', (self, [id], res) => {
      if (res?.id === currentUserId) {
        return { ...res, username: CUSTOM_NAME, bio: CUSTOM_ABOUT }
      }
      return res
    })

    // Patch getCurrentUser
    Patcher.after(UserStore, 'getCurrentUser', (self, args, res) => {
      if (res?.id === currentUserId) {
        return { ...res, username: CUSTOM_NAME, bio: CUSTOM_ABOUT }
      }
      return res
    })
  },

  onStop() {
    Patcher.unpatchAll()
  }
}

registerPlugin(ProfileSpoofer)
