import {initBrowser, wait} from '../tools'
const configBuilder = require('@qwant/nconf-builder')
const config = configBuilder.get()
const APP_URL = `http://localhost:${config.PORT}`

let browser
let page
const mockAutocomplete = require('../../__data__/autocomplete')

beforeAll(async () => {
  let browserPage = await initBrowser()
  page = browserPage.page
  browser = browserPage.browser
  await page.setRequestInterception(true)
  page.on('request', interceptedRequest => {
    if(interceptedRequest.url().match(/autocomplete/)) {
      interceptedRequest.headers['Access-Control-Allow-Origin'] = '*'
      interceptedRequest.respond({body : JSON.stringify(mockAutocomplete), headers  : interceptedRequest.headers})
    } else {
      interceptedRequest.continue()
    }
  })
})

test('clear button',async () => {
  expect.assertions(3)
  await page.goto(APP_URL)
  await page.keyboard.type('Hello')
  let cleanHandle = await page.waitForSelector('#clear_button')
  expect(cleanHandle).not.toBeNull()

  let search_value = await page.evaluate(() => {
      return document.querySelector('#search').value
    })
  expect(search_value).toEqual('Hello');

  await page.click('#clear_button')
  let search_value_after_clear = await page.evaluate(() => {
      return document.querySelector('#search').value
    })
  expect(search_value_after_clear).toEqual('');

})

test('simple search', async () => {
  expect.assertions(1)
  await page.goto(APP_URL)
  await page.keyboard.type('test')
  await wait(100)
  const autocompleteItems = await page.waitForSelector('.autocomplete_suggestion')
  expect(autocompleteItems).not.toBeNull()
})

test('move to on click', async () => {
  expect.assertions(2)
  await page.goto(APP_URL)
  let map_position_before = await page.evaluate(() => {
    return window.MAP_MOCK.center
  })
  await page.keyboard.type('Hello')
  await page.waitForSelector('.autocomplete_suggestion')
  await page.click('.autocomplete_suggestion:nth-child(3)')
  let map_position_after = await page.evaluate(() => {
    return window.MAP_MOCK.center
  })
  expect(map_position_before).not.toEqual(map_position_after);
  const [expectedLng, expectedLat] = mockAutocomplete.features[2].geometry.coordinates
  expect(map_position_after).toEqual({lat: expectedLat, lng: expectedLng})
});

test('bbox & center', async () => {
  expect.assertions(3)
  await page.goto(APP_URL)
  await page.keyboard.type('test')
  await wait(100)
  await page.waitForSelector('.autocomplete_suggestion')
  await page.click('.autocomplete_suggestion:nth-child(1)')
  let {center, zoom} = await page.evaluate(() => {
    return {center : window.MAP_MOCK.getCenter(), zoom : window.MAP_MOCK.getZoom()}
  })
  expect(center).toEqual({ lat: 5, lng: 30 })
  expect(zoom).toEqual(18)

  await page.keyboard.type('test')
  await wait(100)
  await page.waitForSelector('.autocomplete_suggestion')
  await page.click('.autocomplete_suggestion:nth-child(2)')
  center = await page.evaluate(() => {
    return window.MAP_MOCK.getCenter()
  })
  expect(center).toEqual({ lat: 1, lng: 4 })
})

afterAll(() => {
  browser.close()
})
