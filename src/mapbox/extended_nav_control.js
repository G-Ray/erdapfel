class ExtendedControl {

  constructor() {
    this._container = document.createElement('div')
    this._zoomInButton = this._createButton('mapboxgl-ctrl-icon mapboxgl-ctrl-zoom-in', 'Zoom In', () => this._map.zoomIn())
    this._zoomOutButton = this._createButton('mapboxgl-ctrl-icon mapboxgl-ctrl-zoom-out', 'Zoom Out', () => this._map.zoomOut())
    this._compass = this._createButton('mapboxgl-ctrl-icon mapboxgl-ctrl-compass', 'Reset North', () => {
      this._resetNorthAndTilt()
    })
    this._compassArrow = document.createElement('span')
    this._compassArrow.setAttribute('class', 'mapboxgl-ctrl-compass-arrow')
    this._compass.appendChild(this._compassArrow)

    this._center = this._createButton('mapboxgl-ctrl-icon mapboxgl-ctrl-geolocate', 'Geolocate', () => {
      this._geolocate()
    })

  }

  onAdd(map) {
    this._map = map
    this._container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group'
    this._container.textContent = ''
    this._container.appendChild(this._compass)
    this._container.appendChild(this._center)
    this._container.appendChild(this._zoomInButton)
    this._container.appendChild(this._zoomOutButton)
    const _pitchAndRotateCompassArrow = this._pitchAndRotateCompassArrow.bind(this)

    _pitchAndRotateCompassArrow()

    this._map.on('rotate', _pitchAndRotateCompassArrow)
    this._map.on('pitch', _pitchAndRotateCompassArrow)

    return this._container
  }

  onRemove() {
    this._container.parentNode.removeChild(this._container)
    this._map = undefined
  }

  _geolocate() {
    navigator.geolocation.getCurrentPosition((position) => {
      this._map.flyTo({center: [position.coords.longitude, position.coords.latitude]})
    })
  }

  _createButton(className, ariaLabel, fn) {
    const a = document.createElement('button')
    a.setAttribute('class', className)
    a.setAttribute('aria-label', ariaLabel)
    a.addEventListener('click', fn)
    this._container.appendChild(a)
    return a
  }

  _resetNorthAndTilt() {
    this._map.easeTo({pitch: 0, bearing: 0})
  }

  _pitchAndRotateCompassArrow() {
    const pitchAndRotate = `scale(1, ${(1 - this._map.getPitch() / 110)}) rotate(${this._map.transform.angle * (180 / Math.PI)}deg)`
    this._compassArrow.style.transform = pitchAndRotate
  }
}

module.exports = ExtendedControl
