export default defineEventHandler((event) => {
  // for now it's not necessary any handling of the request
  setResponseStatus(event, 404)

  return
})
