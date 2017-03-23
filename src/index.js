const linebot = require('linebot');
const actions = require('./actions')
const outgoing = require('./outgoing')
const incoming = require('./incoming')
const bodyParser = require('body-parser')
const checkVersion = require('botpress-version-manager')

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

const initializeLine = (bp, configurator) => {
  return configurator.loadAll()
  .then(config => {
    line = linebot({
      channelId: config.channelId,
      channelSecret: config.channelSecret,
      channelAccessToken: config.channelAccessToken
    });
  })
}

const parser = bodyParser.json({
	verify: function (req, res, buf, encoding) {
		req.rawBody = buf.toString(encoding);
	}
});

module.exports = {

  config: {
    channelID: { type: 'string', required: true, default: '', env: 'CHANNEL_ID' },
    channelSecret: { type: 'string', required: true, default: '', env: 'CHANNEL_SECRET' },
    channelAccessToken: { type: 'string', required: true, default: '', env: 'CHANNEL_ACCESS_TOKEN' }
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
  },

  ready: async function(bp, configurator) {
    // Your module's been loaded by Botpress.
    // Serve your APIs here, execute logic, etc.

    const config = await configurator.loadAll()
    
    initializeLine(bp, config)
    .then(() => {
      incoming(bp, line)

      var router = bp.getRouter('botpress-line', { auth: false })
      router.post('/webhook', parser, (req, res) => {
        console.log("webhook requested", req.body)
        if (!line.verify(req.rawBody, req.get('X-Line-Signature'))) {
          return res.sendStatus(400);
        }
        line.parse(req.body);
        console.log("webhook requested", req.body)
        return res.json({});
      }
    }
  }
}

