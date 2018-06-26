const App = require( './../../bin/app')
const configBuilder = require('nconf-builder')
const config = configBuilder.get()
global.appServer = new App(config)

configBuilder.set('store:name', 'local_store')
configBuilder.set('mapStyle:baseMapUrl', "[]")
configBuilder.set('mapStyle:poiMapUrl', "[]")
configBuilder.set('services:geocoder:url', `http://localhost:${config.PORT}/autocomplete`)

module.exports = async function () {
  console.log(`Start test on PORT : ${config.PORT}`)
  await global.appServer.start(config.PORT)
}