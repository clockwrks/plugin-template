import manifest from '../manifest.json'
import { Plugin, registerPlugin } from 'enmity/managers/plugins'
import { bulk, filters } from 'enmity/metro'

const FAKE_BADGES = [
  {
    id: 'nitro',
    description: 'Nitro',
    icon: 'https://discord.com/assets/2ba85e8026a861c81b0f50d41f381c3b.svg',
  },
  {
    id: 'early',
    description: 'Early Supporter',
    icon: 'https://discord.com/assets/23e59d799436a73c024819f84ea0b627.svg',
  },
  {
    id: 'hypesquad-bravery',
    description: 'HypeSquad Bravery',
    icon: 'https://discord.com/assets/efcc751513ec434ea4275ecda4f61136.svg',
  }
]

const [UserProfileStore] = bulk(
  filters.byProps('getUserProfile')
)

let originalGetUserProfile: any

const BadgeSpoofer: Plugin = {
  ...manifest,

  onStart() {
    if (!UserProfileStore) return

    originalGetUserProfile = UserProfileStore.getUserProfile

    UserProfileStore.getUserProfile = (...args: any[]) => {
      const res = originalGetUserProfile?.apply(UserProfileStore, args)
      if (!res) return res

      // only spoof your own profile
      const myId = UserProfileStore.getUserProfile?.().userId
      if (args[0] === myId) {
        return {
          ...res,
          badges: [...(res.badges || []), ...FAKE_BADGES]
        }
      }

      return res
    }

    console.log('[BadgeSpoofer] Fake badges applied locally.')
  },

  onStop() {
    if (originalGetUserProfile) {
      UserProfileStore.getUserProfile = originalGetUserProfile
    }
    console.log('[BadgeSpoofer] Restored original profile store.')
  }
}

registerPlugin(BadgeSpoofer)
