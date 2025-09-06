import { Plugin, registerPlugin } from 'enmity/managers/plugins'
import { create } from 'enmity/patcher'
import { getByProps } from 'enmity/metro'
import manifest from '../manifest.json'

const Patcher = create('MessageRewriter')

// trigger word and replacement
const TRIGGER = '!clock'
const REPLACEMENT = 'clock'

const MessageRewriter: Plugin = {
  ...manifest,

  onStart() {
    const MessageActions = getByProps('sendMessage', 'editMessage')
    if (!MessageActions) return

    Patcher.before(MessageActions, 'sendMessage', (self, args) => {
      try {
        const [channelId, message] = args
        if (message?.content?.startsWith(TRIGGER)) {
          message.content = REPLACEMENT
        }
      } catch (err) {
        console.error('[MessageRewriter] error:', err)
      }
    })
  },

  onStop() {
    Patcher.unpatchAll()
  }
}

registerPlugin(MessageRewriter)
