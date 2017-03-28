const handlePromise = (next, promise) => {
  return promise.then(res => {
    next()
    return res
  })
  .catch(err => {
    next(err)
    throw err
  })
}
const handleText = (event, next, line) => {
  return handlePromise(next, line[event.raw.method](event.raw.to, event.text))
}

module.exports = {
  'text': handleText,
  pending: {}
}
