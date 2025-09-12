import manifest from '../manifest.json'
import { Plugin, registerPlugin } from 'enmity/managers/plugins'
import { bulk, filters } from 'enmity/metro'
import { React } from 'enmity/metro/common'
import { TextInput } from 'enmity/components'

const [MessageStore] = bulk(
  filters.byProps('getMessage', 'getMessages')
)

let originalGetMessages: any

const FakeMessagePlugin: Plugin = {
  ...manifest,

  onStart() {
    if (!MessageStore) return

    originalGetMessages = MessageStore.getMessages

    MessageStore.getMessages = (channelId: string) => {
      const msgs = originalGetMessages?.call(MessageStore, channelId) || []

      // Check if we already injected our fake message
      if (!msgs.some(m => m.id === 'local-fake-message')) {
        const fakeMessage = {
          id: 'local-fake-message', // unique local id
          channel_id: channelId,
          author: {
            id: this.settings?.get('userId', '123456789012345678'),
            username: this.settings?.get('username', 'FakeUser'),
            avatar: null
          },
          content: this.settings?.get('content', 'Hello! This is a local message.'),
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

    console.log('[FakeMessagePlugin] Active: fake messages will appear locally.')
  },

  onStop() {
    if (originalGetMessages) MessageStore.getMessages = originalGetMessages
    console.log('[FakeMessagePlugin] Stopped: restored original message store.')
  },

  getSettingsPanel({ settings }) {
    return (
      <React.Fragment>
        <TextInput
          placeholder='Target User ID'
          value={settings.get('userId', '123456789012345678')}
          onChange={(val: string) => settings.set('userId', val)}
        />
        <TextInput
          placeholder='Fake username'
          value={settings.get('username', 'FakeUser')}
          onChange={(val: string) => settings.set('username', val)}
        />
        <TextInput
          placeholder='Message content'
          value={settings.get('content', 'Hello! This is a local message.')}
          onChange={(val: string) => settings.set('content', val)}
        />
      </React.Fragment>
    )
  }
}

registerPlugin(FakeMessagePlugin)
