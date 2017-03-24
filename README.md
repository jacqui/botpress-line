# botpress-line

**NOTE:** This is a work-in-progress, currently being developed. It's **not ready for use yet**.

Line connector module for [Botpress](http://github.com/botpress/botpress).

This module has been build to accelerate and facilitate development of Line bots.

## Installation

Installing modules on Botpress is simple. By using the CLI, you only need to type this command in your terminal to add the line module to your bot.

```
botpress install line
```

It's also possible to install it through the Botpress UI in the modules section.

## Get started

To setup connection of your chatbot to Line, you need to fill the connection settings directly in the module interface. In fact, you only need to follow these 5 steps and your bot will be active.

Settings can also be set programmatically by providing the settings in the `${modules_config_dir}/botpress-line.json`

TK - Steps to create a Line bot - TK

## Features

### Incoming

* [Profile](#profile)
* [Text messages](#text-messages)
* [Postbacks](#postbacks)
* [Content](#content) - image, video and audio data sent by users
* [Location](#location)
* [Stickers](#stickers)
* [Rooms](#rooms)
* [Follow and Unfollow](#follows)

### Outgoing

* [Text messages](#text-messages-outgoing)
* [Image messages](#image-messages-outgoing)
* [Templated messages](#templates-outgoing) - buttons, confirm, carousel
* [Imagemap messages](#imagemap-messages-outgoing)
* [Postbacks](#postbacks-outgoing)
* [Reply messages](#reply-messages)
* [Push messages](#push-messages)
* [Multicast](#multicast)

## Reference

### Incoming

You can listen to incoming event easily with Botpress by using `bp` built-in `hear` function. You only need to listen to specific Line event to be able to react to user's actions.

```js
bp.middlewares.sendIncoming({
   platform: 'line',
   type: 'message',
   user: profile,
   text: e.message.text,
   raw: e
})
```

#### Profile

You can acces to all user's profile information by using this module. A cache have been implemented to fetch all information about users and this information is sent to middlewares.

```js
{
  id: profile.id,
  platform: 'line',
  name: profile.name,
  picture: profile.picture,
  status: profile.status
}
```

**Note**: All new users are automatically saved by this module in Botpress built-in database (`bp.db`).

#### Text messages

An `event` is sent to middlewares for each incoming text message from Line platform with all specific information.

```js
{
  platform: 'line',
  type: 'message',
  user: profile,
  text: e.message.text,
  raw: e
}
```

Then, you can listen easily to this `event` in your module or bot

```js
bp.hear('hello')
```

#### Postbacks

```js
{
  platform: 'line',
  type: 'postback',
  user: profile,
  text: e.postback.payload,
  raw: e
}
```

#### Content

Incoming messages with rich media are supported. Individual attachments are also emmited individually (see Image, Video, Audio below)

```js
{
  platform: 'line',
  type: 'image',
  user: profile,
  text: e.message.image.length,
  raw: e
}
```

##### Image

Individual Attachment extracted from the Attachments event.

Note that Stickers, Thumbs Up, GIFs and Pictures are considered images too.

```js
{
  platform: 'line',
  type: 'image', // Same for 'video', 'file' and 'audio'
  user: profile,
  text: 'http://www.image.url',
  raw: { type: 'image', payload: { url: '...' }}
}
```

##### Audio
##### Video
##### File

Same signature as `Image` above.

### Outgoing

By using our module, you can send anything you want to your users on Line. In fact, this module support all types of messenge that are available on line (text, images, videos, audios, stickers...).

#### Creating actions without sending them

Note that all the below actions are available under two format: `send___` and `create____`, the latter effectively only creating the middleware Event without sending it to the outgoing middleware. This is useful when combining libraries together (for example Botkit):

```js
  // This message won't be sent
  const message = bp.messenger.createText(event.user.id, 'What is your name?')
  // But `message` is a fully formed middleware event object, ready to be sent
  // example using the botpress-botkit module
  convo.ask(message, function(response, convo) { /* ... */ })
```

### Text messages

In code, it is simple to send a message text to a specific users ([line doc](https://developers.line.com/docs/messenger-platform/send-api-reference/text-message)).

#### `sendText(userId, text, [options])` -> Promise

##### Arguments

1. ` userId ` (_String_): Correspond to unique Line's recipient identifier. Usually, this `recipient_id` is available from input message.

2. ` text ` (_String_): Text message that will be send to user.

3. ` options ` (_Object_): An object that may contain:
- `quick_replies` which is an array of quick replies to attach to the message
- `typing` indicator. true for automatic timing calculation or a number in milliseconds (turns off automatically)
- `waitDelivery` the returning Promise will resolve only when the message is delivered to the user
- `waitRead` the returning Promise will resolve only when the user reads the message

##### Returns

(_Promise_): Send to outgoing middlewares a formatted `Object` than contains all information (platform, type, text, raw) about the text message that needs to be sent to Line platform. The promise resolves when the message was successfully sent to line, except if you set the `waitDelivery` or `waitRead` options.

##### Example

```js
const userId = 'USER_ID'
const text = "Select between these two options?"
const options = {
}

bp.messenger.sendText(userId, text, options)
.then(() => {
  // the message was read because of `waitRead` option  
})
```

### Attachments

By using this function, you can send any type of attachment to your users ([line doc](https://developers.line.com/docs/messenger-platform/send-api-reference/contenttypes)).

#### `sendAttachment(userId, type, url, [options])` -> Promise

##### Arguments

1. ` userId ` (_String_): Correspond to unique Line's recipient identifier

2. ` type ` (_String_): Specific type of  attachment can be `'audio'`, `'file'`, `'image'` or `'video'`

3. ` url ` (_String_): Correspond to specific url of the attachment that need to be sent.

4. ` options ` (_Object_): An object that may contain:
- `quick_replies`
- `typing`
- `waitDelivery` the returning Promise will resolve only when the message is delivered to the user
- `waitRead` the returning Promise will resolve only when the user reads the message

##### Returns

(_Promise_): Send to outgoing middlewares a formatted `Object` than contains all information (platform, type, text, raw) about the attachment that needs to be sent to Line platform.

##### Example

```js
const userId = 'USER_ID'
const type = 'image'
const url = 'https://github.com/botpress/botpress/blob/master/images/botpress-dark.png?raw=true'

bp.messenger.sendAttachment(userId, type, url)
```

### Templates

By using this module, it's easy to send any type of supported template to your users ([line doc](https://devdocs.line.me/en/#template-messages)).

##### Arguments

1. ` userId ` (_String_): Correspond to unique Line's recipient identifier

2. ` payload ` (_Object_): Specific `payload` object for your selected template. Actually, many types of template (button, generic, list, receipt...) are supported by Line.

3. ` options ` (_Object_): An object that may contains:
- `typing`
- `waitDelivery` the returning Promise will resolve only when the message is delivered to the user
- `waitRead` the returning Promise will resolve only when the user reads the message

##### Returns

(_Promise_): Send to outgoing middlewares a formatted `Object` than contains all information (platform, type, text, raw) about the template that needs to be sent.

##### Example

```js
const userId = 'USER_ID'
const payload = {
    template_type: "button",
    text: "Have you seen our awesome website?",
    buttons: [
        {
            type: "web_url",
            url: "https://www.botpress.io",
            title: "Show Website"
        }
    ]
}

bp.messenger.sendTemplate(userId, payload, { typing: 2000 })
```

#### Postbacks

This module support postbacks. Postbacks occur when a user performs an action on a template message ([line doc](https://devdocs.line.me/en/#postback-event)).

#### Automatic profile lookup

Profiles are automatically lookedup using [Line's API](https://devdocs.line.me/en/#bot-api-get-profile). The profile of the user can be found in the incoming middleware events: `event.user`

The following properties are available: displayName, userId, pictureUrl, statusMessage.
 
#### Save users in Database

Users are automatically persisted in the built-in botpress database using the built-in `bp.db.saveUser` function.

#### Webhook security check

botpress-line verifies that requests really come from line's servers by validating requests headers. Line calls this [Signature Validation](https://devdocs.line.me/en/#webhooks).

### Community

There's a [Slack community](https://slack.botpress.io) where you are welcome to join us, ask any question and even help others.

Get an invite and join us now! 👉 [https://slack.botpress.io](https://slack.botpress.io)

### License

botpress-messenger is licensed under AGPL-3.0
