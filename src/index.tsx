import { api } from 'enmity-api';

const {
  patcher,
  messages,
} = api;

let patches = [];

export const onStart = (): void => {
  // Find the message sending function to patch
  const sendMessageFunction = messages.sendMessage;

  // Apply a 'before' patch to the sendMessage function
  const patch = patcher.before(sendMessageFunction, (args) => {
    // The first argument of the sendMessage function is the message data.
    // We access the content and change it to "worked".
    const messageContent = args[1]; // Access the message content object
    if (messageContent && messageContent.content) {
      messageContent.content = 'worked';
    }
  });

  // Store the patch so we can un-patch it later
  patches.push(patch);
};

export const onStop = (): void => {
  // Un-patch all applied patches to prevent memory leaks
  patches.forEach(patch => patch());
  patches = [];
};