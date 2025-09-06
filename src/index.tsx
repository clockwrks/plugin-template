import { Plugin, registerPlugin } from 'enmity/managers/plugins';
import { create } from 'enmity/patcher';
import { React } from 'enmity/metro/common';
import manifest from '../manifest.json';

const Patcher = create('NameReplacer');

// Edit these
const TARGET_STRING = 'clockwrks';           // exact string to replace
const REPLACEMENT = 'YourCustomName';        // what you want to show instead
const WATERMARK = ' [LOCAL SPOOF]';          // kept to avoid misuse

const NameReplacer: Plugin = {
  ...manifest,

  onStart() {
    try {
      Patcher.instead(React, 'createElement', (self, args: any[], orig: Function) => {
        try {
          const [type, props, ...children] = args;

          const replaceNode = (node: any): any => {
            if (typeof node === 'string') {
              if (node === TARGET_STRING) return REPLACEMENT + WATERMARK;
              if (node.includes(TARGET_STRING)) return node.split(TARGET_STRING).join(REPLACEMENT + WATERMARK);
              return node;
            }
            if (Array.isArray(node)) return node.map(replaceNode);
            // leave React elements / objects alone — their children will be processed when their createElement call runs
            return node;
          };

          const newProps = props ? { ...props } : props;
          if (newProps && newProps.children !== undefined) {
            newProps.children = replaceNode(newProps.children);
          }

          const newChildren = children.map(replaceNode);
          return orig.apply(self, [type, newProps, ...newChildren]);
        } catch (innerErr) {
          return orig.apply(self, args);
        }
      });

      // small debug message (remove if you want)
      console.log('[NameReplacer] started - replacing', TARGET_STRING, '→', REPLACEMENT + WATERMARK);
    } catch (err) {
      console.error('[NameReplacer] failed to patch React.createElement', err);
    }
  },

  onStop() {
    Patcher.unpatchAll('NameReplacer');
    console.log('[NameReplacer] stopped');
  }
};

registerPlugin(NameReplacer);
