import manifest from '../manifest.json'
import { Plugin, registerPlugin } from 'enmity/managers/plugins'
import { bulk, filters } from 'enmity/metro'

const [MessageStore] = bulk(
  filters.byProps('getMessage', 'getMessages')
)

let originalGetMessages: any

const HardcodedFakeMessage: Plugin = {
  ...manifest,

  onStart() {
    if (!MessageStore) return

    originalGetMessages = MessageStore.getMessages

    MessageStore.getMessages = (channelId: string) => {
      const msgs = originalGetMessages?.call(MessageStore, channelId) || []

      // Only add the fake message once
      if (!msgs.some(m => m.id === '7777777')) {
        const fakeMessage = {
          id: '7777777',          // unique local ID
          channel_id: channelId,
          author: {
            id: '170867078985678848',       // hardcoded user ID
            username: '11haunt',           // hardcoded username
            avatar: null
          },
          content: 'Hello, this is a hardcoded fake message!',  // hardcoded content
          timestamp: Date.now(),
          edited_timestamp: null,
          type: 0,
          pinned: false,
          mentions: [],
          mention_roles: [],
          attachments: [],
          embeds: []
        }
        msgs.push(fakeMessage)
      }

      return msgs
    }

    console.log('[HardcodedFakeMessage] Active: fake message injected.')
  },

  onStop() {
    if (originalGetMessages) MessageStore.getMessages = originalGetMessages
    console.log('[HardcodedFakeMessage] Stopped: restored original messages.')
  }
}

registerPlugin(HardcodedFakeMessage)
