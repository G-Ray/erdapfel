import mapboxgl from 'mapbox-gl'
import ExtendedControl from "../mapbox/extended_nav_control"
import qwantStyle from '@qwant/qwant-basic-gl-style/style.json'
import Poi from "../mapbox/poi";

function Scene() {
  this.currentMarker = null
  this.mb = new mapboxgl.Map({
    container: 'scene_container',
    style: qwantStyle,
    zoom: 14,
    center: [2.2900, 48.8719],
    hash: true
  })

  this.mb.on('load', () => {
    const extendedControl = new ExtendedControl()
    this.mb.addControl(extendedControl, 'bottom-right')

    this.mb.on('mousemove', 'poi-level-3', () => {
      this.mb.getCanvas().style.cursor = 'pointer';
    })

    this.mb.on('mouseleave', 'poi-level-3', () =>{
      this.mb.getCanvas().style.cursor = '';
    })

    this.mb.on('click', 'poi-level-1', (e) => {
      let poi = Poi.sceneLoad(e, this.mb.getZoom())
      fire('mark_poi', poi)
    })

    this.mb.on('click', 'poi-level-2', (e) => {
      let poi = Poi.sceneLoad(e, this.mb.getZoom())
      fire('mark_poi', poi)
    })

    this.mb.on('click', 'poi-level-3', (e) => {
      let poi = Poi.sceneLoad(e, this.mb.getZoom())
      fire('mark_poi', poi)
    })
  })

  listen('fly_to', (poi) => {
    this.flyTo(poi)
  })

  listen('fit_bounds', (poi, options) => {
    this.fitBounds(poi, options)
  })

  listen('mark_poi', (poi) => {
    this.addMarker(poi)
  })
}

Scene.prototype.flyTo = function (poi) {
  if(poi.zoom) {
    this.mb.flyTo({
      center : poi.getLngLat(),
      zoom : poi.zoom
    })
  } else {
    this.mb.flyTo({
      center : poi.getLngLat()
    })
  }
}

Scene.prototype.fitBounds = function (poi) {
  this.mb.fitBounds(poi.bbox, poi.padding)
}

Scene.prototype.addMarker = function(poi) {
  if(this.currentMarker !== null) {
    this.currentMarker.remove()
  }
  let marker = new mapboxgl.Marker()
    .setLngLat(poi.getLngLat())
    .addTo(this.mb)
  this.currentMarker = marker
  return marker
}

export default Scene
