import LRU from 'lru-cache'

import Users from './users'
import outgoing from './outgoing'

import _ from 'lodash'

module.exports = (bp, line) => {

  const users = Users(bp, line)

  const messagesCache = LRU({
    max: 10000,
    maxAge: 60 * 60 * 1000
  })

  const preprocessEvent = payload => {

    const userId = payload.source.userId
    const mid = payload.message && payload.message.id

    if (mid && !messagesCache.has(mid)) {
      // We already processed this message
      payload.alreadyProcessed = true
    } else {
      // Mark it as processed
      messagesCache.set(mid, true)
    }

    return users.getUserProfile(userId)
  }

  line.on('message', e => {
    preprocessEvent(e)
    .then(profile => {
      // push the message to the incoming middleware
      switch (e.message.type) {
        case 'text':
          bp.middlewares.sendIncoming({
            platform: 'line',
            type: 'text',
            user: profile,
            text: e.message.text,
            raw: e
          })
          break

        case 'sticker':
          bp.middlewares.sendIncoming({
            platform: 'line',
            type: 'sticker',
            user: profile,
            text: e.message.packageId + '/' + e.message.stickerId,
            raw: e
          })
          break
      }
    })
  })

  line.on('follow', e => {
    preprocessEvent(e)
    .then(profile => {
      // push the message to the incoming middleware
      bp.middlewares.sendIncoming({
        platform: 'line',
        type: 'message',
        user: profile,
        text: e.message.text,
        raw: e
      })
    })
  })

  line.on('unfollow', e => {
    preprocessEvent(e)
    .then(profile => {
      // push the message to the incoming middleware
      bp.middlewares.sendIncoming({
        platform: 'line',
        type: 'message',
        user: profile,
        text: e.message.text,
        raw: e
      })
    })
  })

  line.on('join', e => {
    preprocessEvent(e)
    .then(profile => {
      // push the message to the incoming middleware
      bp.middlewares.sendIncoming({
        platform: 'line',
        type: 'message',
        user: profile,
        text: e.message.text,
        raw: e
      })
    })
  })

  line.on('leave', e => {
    preprocessEvent(e)
    .then(profile => {
      // push the message to the incoming middleware
      bp.middlewares.sendIncoming({
        platform: 'line',
        type: 'message',
        user: profile,
        text: e.message.text,
        raw: e
      })
    })
  })

  line.on('postback', e => {
    preprocessEvent(e)
    .then(profile => {
      // push the message to the incoming middleware
      bp.middlewares.sendIncoming({
        platform: 'line',
        type: 'message',
        user: profile,
        text: e.message.text,
        raw: e
      })
    })
  })

  line.on('beacon', e => {
    preprocessEvent(e)
    .then(profile => {
      // push the message to the incoming middleware
      bp.middlewares.sendIncoming({
        platform: 'line',
        type: 'message',
        user: profile,
        text: e.message.text,
        raw: e
      })
    })
  })
  
}
