import manifest from '../manifest.json'
import { registerPlugin } from 'enmity/managers/plugins'
import { bulk, filters } from 'enmity/metro'
import * as React from 'react'
import { Toasts } from 'enmity/modules/toast'

const idAliasMap: Record<string, string> = {
  '1117005234301050882': 'Alice (LOCAL ALIAS)',
  '1327385107677319299': 'SupportBotAlias (LOCAL ALIAS)'
}

const DualProfileView: any = {
  ...manifest,
  onStart() {
    Toasts.show('DualProfileView started')
    const [UserProfileStore] = bulk(filters.byProps('getUserProfile'))
    if (!UserProfileStore) return

    const origGet = UserProfileStore.getUserProfile
    // patch getUserProfile to attach a clear localAlias object when available
    // @ts-ignore
    UserProfileStore.getUserProfile = function (id: string) {
      const res = origGet.apply(this, arguments)
      try {
        if (res && res.user && id && idAliasMap[id]) {
          res.localAlias = {
            label: 'LOCAL ALIAS VIEW',
            alias: idAliasMap[id]
          }
          // append a conspicuous marker to the display name so users cannot mistake it for official data
          const marker = ' • [LOCAL ALIAS]'
          if (res.user.username && !res.user.username.includes(marker)) {
            res.user.username = res.user.username + marker
          }
          if (res.user.display_name && !res.user.display_name.includes(marker)) {
            res.user.display_name = res.user.display_name + marker
          }
        }
      } catch (e) {}
      return res
    }
    // try to patch profile modal render to inject a second panel if present
    const [UserProfileModal] = bulk(filters.byProps('open', 'close', 'isOpen'))
    if (UserProfileModal && UserProfileModal.prototype) {
      const proto = UserProfileModal.prototype
      if (!proto.__dualProfilePatched) {
        const origRender = proto.render
        proto.__dualProfilePatched = true
        proto.render = function () {
          const vnode = origRender.apply(this, arguments)
          try {
            // find props with profile data
            const props = (this.props || this.state || {})
            const profile = props.profile ?? (props.userId ? UserProfileStore.getUserProfile(props.userId) : null)
            if (profile && profile.localAlias) {
              const aliasPanel = React.createElement('div', {
                style: {
                  padding: 12,
                  marginTop: 8,
                  borderTop: '1px solid rgba(0,0,0,0.08)'
                }
              },
              React.createElement('div', { style: { fontWeight: 700, marginBottom: 6 } }, profile.localAlias.label),
              React.createElement('div', null, profile.localAlias.alias),
              React.createElement('div', { style: { marginTop: 6, fontSize: 12, color: 'rgba(0,0,0,0.6)' } }, 'This is a local overlay only. IDs and original data remain unchanged.'))
              // attempt to append aliasPanel to modal body if structure matches common patterns
              const body = vnode && vnode.props && vnode.props.children
              if (body) {
                // naive injection: if children is array, push; else wrap
                if (Array.isArray(body)) {
                  body.push(aliasPanel)
                } else if (body.props && Array.isArray(body.props.children)) {
                  body.props.children.push(aliasPanel)
                }
              }
            }
          } catch (e) {}
          return vnode
        }
      }
    }
    ;(this as any)._origGetUserProfile = origGet
    ;(this as any)._origModalProto = UserProfileModal && UserProfileModal.prototype
  },
  onStop() {
    Toasts.show('DualProfileView stopped')
    try {
      const [UserProfileStore] = bulk(filters.byProps('getUserProfile'))
      if (UserProfileStore && (this as any)._origGetUserProfile) {
        UserProfileStore.getUserProfile = (this as any)._origGetUserProfile
      }
      const proto = (this as any)._origModalProto
      if (proto && proto.__dualProfilePatched) {
        // cannot reliably restore original render if lost; best-effort: delete patched flag
        delete proto.__dualProfilePatched
      }
    } catch (e) {}
  }
}

registerPlugin(DualProfileView)
export default DualProfileView
