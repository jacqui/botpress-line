const linebot = require('linebot')
const actions = require('./actions')
const outgoing = require('./outgoing')
const incoming = require('./incoming')
const bodyParser = require('body-parser')
const checkVersion = require('botpress-version-manager')
const _ = require('lodash')
const Promise = require('bluebird')

let line = null
const outgoingPending = outgoing.pending

const outgoingMiddleware = (event, next) => {
  if (event.platform !== 'line') {
    return next()
  }

  if (!outgoing[event.type]) {
    return next('Unsupported event type: ' + event.type)
  }

  const setValue = method => (...args) => {
    if (event.__id && outgoingPending[event.__id]) {
      outgoingPending[event.__id][method].apply(null, args)
      delete outgoingPending[event.__id]
    }
  }
  
  outgoing[event.type](event, next, line)
  .then(setValue('resolve'), setValue('reject'))
}

const initializeLine = (bp, config) => {
  line = linebot({
    channelId: config.channelId,
    channelSecret: config.channelSecret,
    channelAccessToken: config.channelAccessToken
  })
}

const parser = bodyParser.json({
	verify: function (req, res, buf, encoding) {
		req.rawBody = buf.toString(encoding)
	}
})

module.exports = {

  config: {
    channelID: { type: 'string', required: true, default: '', env: 'LINE_CHANNEL_ID' },
    channelSecret: { type: 'string', required: true, default: '', env: 'LINE_CHANNEL_SECRET' },
    channelAccessToken: { type: 'string', required: true, default: '', env: 'LINE_CHANNEL_ACCESS_TOKEN' }
  },

  init: async function(bp) {
    // This is called before ready.
    // At this point your module is just being initialized, it is not loaded yet.
    checkVersion(bp, __dirname)

    bp.middlewares.register({
      name: 'line.sendMessages',
      type: 'outgoing',
      order: 100,
      handler: outgoingMiddleware,
      module: 'botpress-messenger',
      description: 'Sends out messages that targets platform = messenger.' +
      ' This middleware should be placed at the end as it swallows events once sent.'
    })

    bp.line = {}
    _.forIn(actions, (action, name) => {
      bp.line[name] = action

      var sendName = name.replace(/^create/, 'send')
      bp.line[sendName] = Promise.method(function() {
        var msg = action.apply(this, arguments)
        msg.__id = new Date().toISOString() + Math.random()
        const resolver = { event: msg }
        
        const promise = new Promise(function(resolve, reject) {
          resolver.resolve = resolve
          resolver.reject = reject
        })
        
        outgoingPending[msg.__id] = resolver
        
        bp.middlewares.sendOutgoing(msg)
        return promise
      })
    })

  },

  ready: async function(bp, configurator) {
    const config = await configurator.loadAll()
    
    initializeLine(bp, config)
    incoming(bp, line)

    var router = bp.getRouter('botpress-line', {
      'bodyParser.json': false,
      auth: req => !/\/webhook/i.test(req.originalUrl)
    })
    
    router.use(bodyParser.json({
      verify: (req, res, buf, encoding) => {
        req.rawBody = buf.toString(encoding)
      }
    }))

    router.post('/webhook', parser, (req, res) => {
      if (!line.verify(req.rawBody, req.get('X-Line-Signature'))) {
        return res.sendStatus(400)
      }

      line.parse(req.body)
      
      return res.sendStatus(200)
    })
  }
}

