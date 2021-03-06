const configBuilder = require('@qwant/nconf-builder')
const config = configBuilder.get()
const APP_URL = `http://localhost:${config.PORT}`
const poiMock = require('../../__data__/poi')
import {initBrowser, getText, wait, clearStore} from '../tools'
import {getFavorites, toggleFavoritePanel} from '../favorites_tools'

let browser
let page

beforeAll(async () => {
  let browserPage = await initBrowser()
  page = browserPage.page
  browser = browserPage.browser
  await page.setRequestInterception(true)
  page.on('request', interceptedRequest => {
    if(interceptedRequest.url().match(/autocomplete/)) {
      interceptedRequest.headers['Access-Control-Allow-Origin'] = '*'
      const autocompleteMock = require('../../__data__/autocomplete')
      interceptedRequest.respond({body : JSON.stringify(autocompleteMock), headers  : interceptedRequest.headers})
    } else if(interceptedRequest.url().match(/poi/)) {
      interceptedRequest.headers['Access-Control-Allow-Origin'] = '*'

      interceptedRequest.respond({body : JSON.stringify(poiMock), headers  : interceptedRequest.headers})
    } else {
      interceptedRequest.continue()
    }
  })
})

test('click on a poi', async () => {
  expect.assertions(2)
  await page.goto(APP_URL)
  await selectPoiLevel(page, 1)
  const poiPanel = await page.waitForSelector('.poi_panel__title ')
  expect(poiPanel).not.toBeFalsy()
  const translatedSubClass = await getText(page, '.poi_panel__description')
  expect(translatedSubClass).toEqual('musée')
})

test('load a poi from url', async () => {
  expect.assertions(2)
  await page.goto(`${APP_URL}/place/osm:way:63178753@Musée_dOrsay#map=17.49/2.3261037/48.8605833`)
  await page.waitForSelector('.poi_panel__title')
  let {title, address} = await page.evaluate(() => {
    return {
      title: document.querySelector('.poi_panel__title').innerText,
      address: document.querySelector('.poi_panel__address').innerText
    }
  })
  expect(title).toMatch(/Musée d\'Orsay/)
  expect(address).toMatch(/1 Rue de la Légion d\'Honneur \(Paris\)/)
})

test('load a poi already in my favorite from url', async () => {
  expect.assertions(1)
  await page.goto(APP_URL)
  await page.evaluate(() => {
    fire('store_poi', new Poi('osm:way:63178753', 'some poi', '', {lat : 43, lng : 2}, '', '', []))
  })
  await page.goto(`${APP_URL}/place/osm:way:63178753@Musée_dOrsay#map=17.49/2.3261037/48.8605833`)
  let plainStar = await page.waitForSelector('.icon-icon_star-filled')
  expect(plainStar).not.toBeFalsy()
})

test('update url after a poi click', async () => {
  expect.assertions(1)
  await page.goto(APP_URL)
  await selectPoiLevel(page, 1)
  let location = await page.evaluate(() => {
    return document.location.href
  })
  expect(location).toMatch(/@Mus%C3%A9e_dOrsay/)
})

test('update url after a favorite poi click', async () => {
  expect.assertions(1)
  await page.goto(APP_URL)
  page.evaluate(() => {
    fire('store_poi', new Poi(1, 'some poi i will click', '', {lat : 43, lng : 2}, '', '', []))
  })
  await page.click('.service_panel__item__fav')
  await wait(300)
  await page.click('.favorite_panel__swipe_element')
  await wait(400)
  let location = await page.evaluate(() => {
    return document.location.href
  })
  expect(location).toMatch(/@Mus%C3%A9e_dOrsay/)
})

test('open poi from autocomplete selection', async () => {
  expect.assertions(2)
  await page.goto(APP_URL)
  await page.keyboard.type('test')
  await page.waitForSelector('.autocomplete_suggestion')
  await page.click('.autocomplete_suggestion:nth-child(2)')
  await wait(300)
  let location = await page.evaluate(() => {
    return document.location
  })

  // url is updated
  expect(location.href).toMatch(/osm:way:63178753@Mus%C3%A9e_dOrsay/)

  // poi panel is visible
  expect(await page.$('.poi_panel.poi_panel--hidden')).toBeFalsy()
})

test('display a popup on hovering a poi', async () => {
  expect.assertions(1)
  await page.goto(APP_URL)
  await selectPoiLevel(page, 1)
  let popups = await page.evaluate(() => {
    return window.MAP_MOCK.popups
  })
  expect(popups).toHaveLength(1)
})

test('center the map to the poi on a poi click', async () => {
  await page.goto(`${APP_URL}/place/osm:way:63178753@Musée_dOrsay#map=17.49/2.3261037/48.8605833`)
  await page.waitForSelector('.poi_panel__title')
  expect.assertions(1)
  await page.evaluate(() => {
    MAP_MOCK.flyTo({center : {lat : 0, lng : 0}, zoom : 10})
  })

  await page.click('.poi_panel__description_container')
  let center = await page.evaluate(() => {
    return MAP_MOCK.getCenter()
  })
  expect(center).toEqual({lng  : poiMock.geometry.coordinates[0], lat : poiMock.geometry.coordinates[1]})
})

test('display details about the poi on a poi click', async () => {
  await page.goto(`${APP_URL}/place/osm:way:63178753@Musée_dOrsay#map=17.49/2.3261037/48.8605833`)
  await page.waitForSelector('.poi_panel__title')
  expect.assertions(6)

  await page.click('.poi_panel__description_container')
  let infoTitle = await page.evaluate(() => {
    return document.querySelector('.poi_panel__sub_block__title').innerText
  })
  expect(infoTitle).toEqual('Accessible en fauteuil roulant')
  await page.click('.poi_panel__block__collapse')

  await wait(300)
  infoTitle = await page.evaluate(() => {
    return document.querySelector('.poi_panel__sub_block__title').innerText
  })
  expect(infoTitle).toEqual('Services & informations')

  let {hours, phone, website} = await page.evaluate(() => {
    return {
      hours: document.querySelector('.poi_panel__info__hours__status').innerText,
      phone: document.querySelector('.poi_panel__info__section__phone').innerText,
      website: document.querySelector('.poi_panel__info__link').innerText
    }
  })
  expect(hours).toMatch("Fermé ")
  expect(phone).toMatch("+33140494814")
  expect(website).toMatch("www.musee-orsay.fr")

  let wiki_block = await page.waitForSelector('.poi_panel__info__wiki')
  expect(wiki_block).not.toBeFalsy()
})

test('check pre-loaded Poi error handling', async () => {
  expect.assertions(1)

  await page.goto(`${APP_URL}/place/osm:way:2403`)
  let pathname = await page.evaluate(() => {
    return location.pathname
  })
  expect(pathname).toEqual('/')
})

async function selectPoiLevel(page, level) {
  await page.evaluate((level) => {
    window.MAP_MOCK.evented.prepare('click', `poi-level-${level}`,  {originalEvent : {clientX : 1000},features : [{properties :{global_id : 1}}]})
  }, level)
  await page.click('#mock_poi')
  await wait(300)
}

test('add a poi as favorite and find it back in the favorite menu', async () => {
  expect.assertions(7)
  await page.goto(APP_URL)

  // we select a poi and 'star' it
  await selectPoiLevel(page, 1)
  let poiPanel = await page.waitForSelector('.poi_panel__title')
  expect(poiPanel).not.toBeFalsy()
  await page.click('.poi_panel__actions__icon__store')

  // we check that the first favorite item is our poi
  await toggleFavoritePanel(page)
  let fav = await getFavorites(page)
  expect(fav).toHaveLength(1)
  expect(fav[0].title).toEqual("Musée d'Orsay")
  expect(fav[0].desc).toEqual("musée")
  expect(fav[0].icons).toContainEqual("icon-museum")

  // we then reopen the poi panel and 'unstar' the poi.
  await wait(100)
  await page.click('#favorite_item_0')
  await wait(300)
  poiPanel = await page.waitForSelector('.poi_panel__title')
  expect(poiPanel).not.toBeFalsy()

  await page.click('.poi_panel__actions__store_container')

  // it should disapear from the favorites
  await toggleFavoritePanel(page)
  fav = await getFavorites(page)
  expect(fav).toEqual([])
})

afterEach(() => {
  clearStore(page)
})

afterAll(() => {
  browser.close()
})
