
const validateType = (options, recipient) => {
  // TODO Check type + recipient
}
const createText = (recipient, text, options) => {
  // method can be 'reply', 'push' or 'multicast'
  const method = (options && options.method) || 'push'

  // TODO Validate text

  return {
    platform: 'line',
    type: 'text',
    text: text,
    raw: {
      to: recipient,
      message: text,
      method: method
    }
  }
}

// TODO: Support the messages below:
// Text
// Image
// Video
// Audio
// Location
// Sticker
// Imagemap
// Template

module.exports = { createText }
