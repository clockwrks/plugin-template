import manifest from '../manifest.json'
import { Plugin, registerPlugin } from 'enmity/managers/plugins'
import { bulk, filters } from 'enmity/metro'

const NEW_USERNAME = 'MyLocalName'

const [UserStore] = bulk(
  filters.byProps('getCurrentUser', 'getUser')
)

let originalGetCurrentUser: any
let originalGetUser: any

const UsernameSpoofer: Plugin = {
  ...manifest,

  onStart() {
    if (!UserStore) return

    const currentUserId = UserStore.getCurrentUser()?.id
    if (!currentUserId) return

    // Patch getCurrentUser
    originalGetCurrentUser = UserStore.getCurrentUser
    UserStore.getCurrentUser = (...args: any[]) => {
      const res = originalGetCurrentUser?.apply(UserStore, args)
      if (!res) return res
      return { ...res, username: NEW_USERNAME }
    }

    // Patch getUser (so your profile shows the spoof too)
    originalGetUser = UserStore.getUser
    UserStore.getUser = (...args: any[]) => {
      const res = originalGetUser?.apply(UserStore, args)
      if (!res) return res
      if (args[0] === currentUserId) {
        return { ...res, username: NEW_USERNAME }
      }
      return res
    }

    console.log('[UsernameSpoofer] Local username spoof active.')
  },

  onStop() {
    if (originalGetCurrentUser) UserStore.getCurrentUser = originalGetCurrentUser
    if (originalGetUser) UserStore.getUser = originalGetUser

    console.log('[UsernameSpoofer] Restored original functions.')
  }
}

registerPlugin(UsernameSpoofer)
