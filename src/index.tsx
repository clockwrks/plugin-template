import manifest from '../manifest.json'
import { registerPlugin } from 'enmity/managers/plugins'
import { bulk, filters } from 'enmity/metro'
import { Toasts } from 'enmity/modules/toast'

const Workedifier: any = {
  ...manifest,
  onStart() {
    Toasts.show('Workedifier started')
    const [MessageActions] = bulk(filters.byProps('sendMessage', 'editMessage'))
    if (!MessageActions) return

    const origSend = MessageActions.sendMessage
    // @ts-ignore
    MessageActions.sendMessage = function () {
      try {
        const args = Array.from(arguments)
        // find the message payload argument (string or object with content)
        for (let i = 0; i < args.length; i++) {
          const a = args[i]
          if (typeof a === 'string') {
            if (a.startsWith('/')) break // leave commands intact
            args[i] = workedifyString(a)
            break
          }
          if (a && typeof a === 'object' && 'content' in a && typeof a.content === 'string') {
            if (a.content.startsWith('/')) break
            // preserve other fields, only replace content
            args[i] = Object.assign({}, a, { content: workedifyString(a.content) })
            break
          }
        }
        return origSend.apply(this, args)
      } catch (e) {
        return origSend.apply(this, arguments)
      }
    }

    ;(this as any)._origSend = origSend
  },
  onStop() {
    Toasts.show('Workedifier stopped')
    const [MessageActions] = bulk(filters.byProps('sendMessage'))
    if (MessageActions && (this as any)._origSend) {
      MessageActions.sendMessage = (this as any)._origSend
    }
  }
}

function workedifyString(s: string): string {
  // replace every word token with 'worked', keep whitespace and punctuation
  // word defined as sequence of Unicode letters/digits/underscore
  return s.replace(/[\p{L}\p{N}_]+/gu, 'worked')
}

registerPlugin(Workedifier)
export default Workedifier
