/**
 * @name ProfileSwap
 * @description Locally replace your avatar and name with another user’s.
 * @version 1.0.0
 */

import { Patcher, Settings } from 'enmity/api'
import { getModule } from 'enmity/modules'

const UserStore = getModule(m => m.getUser, false)
const Avatar = getModule(m => m?.default?.displayName === 'Avatar', false)
const Name = getModule(m => m?.default?.displayName === 'Username', false)

export default {
  name: 'ProfileSwap',

  onStart() {
    const getTarget = () => {
      const id = Settings.get('targetId', '')
      return UserStore.getUser(id)
    }

    Patcher.after(Avatar, 'default', (_, args, res) => {
      const props = args[0]
      if (props?.userId === UserStore.getCurrentUser().id) {
        const target = getTarget()
        if (target?.avatar) {
          res.props.src = `https://cdn.discordapp.com/avatars/${target.id}/${target.avatar}.png?size=512`
        }
      }
      return res
    })

    Patcher.after(Name, 'default', (_, args, res) => {
      const props = args[0]
      if (props?.userId === UserStore.getCurrentUser().id) {
        const target = getTarget()
        if (target) {
          res.props.children = target.username
        }
      }
      return res
    })
  },

  onStop() {
    Patcher.unpatchAll()
  },

  settings: [
    {
      key: 'targetId',
      type: 'text',
      name: 'Target User ID',
      description: 'Enter the ID of the user to copy.'
    }
  ]
}
