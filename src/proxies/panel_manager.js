import Poi from "../mapbox/poi";

function PanelManager() {}
PanelManager.init = function () {
  window.__panel_manager = {panels : [], listeners : []}
}

PanelManager.setPoi = async function(poi, options) {
  PanelManager.initLoad()
  __panel_manager.panels.forEach((panel) => {
    if(panel.isPoiComplient) {
      panel.setPoi(poi, options)

    } else {
      if(panel.isDisplayed()) {
        panel.close()
      }
    }
  })
  PanelManager.endLoad()
}

PanelManager.registerListener = function (listener) {
  window.__panel_manager.listeners.push(listener)
}

PanelManager.notify = function () {
  window.__panel_manager.listeners.forEach((listener) => {
    listener.notify()
  })
}

PanelManager.getPanels = function() {
  return __panel_manager.panels
}

PanelManager.restorePoi = function() {
  __panel_manager.panels.forEach((panel) => {
    if(panel.isPoiComplient) {
      panel.toggle()
    } else if(panel.isDisplayed()){
      panel.close()
    }
  })
}

PanelManager.loadPoiById = async function(id, options) {
  if(id) {
    let poi = await Poi.poiApiLoad(id)
    if(poi) {
      PanelManager.setPoi(poi, options)
    } else {
      PanelManager.closeAll()
    }
    return poi
  } else {
    PanelManager.closeAll()
  }
}

PanelManager.toggleFavorite = async function () {
  PanelManager.initLoad()
  __panel_manager.panels.find((panel) => {
    if(panel.isFavoritePanel) {
      panel.toggle()
    } else if(panel.active) {
      panel.close()
    }
  })

  PanelManager.endLoad()
}

PanelManager.closeAll = function() {
  __panel_manager.panels.forEach((panel) => {
    panel.close()
  })
}

PanelManager.register = function(panel) {
  let existingPanel = __panel_manager.panels.find((panelIterator) => {
    return panelIterator.panel.cid === panel.panel.cid
  })
  !existingPanel && __panel_manager.panels.push(panel)
}

PanelManager.initLoad = function () {
  document.getElementById('loading_panel').style.transition = ''
  document.getElementById('loading_panel').classList.remove('loading_panel--hidden')

}

PanelManager.endLoad = function () {
  setTimeout(() => {
    document.getElementById('loading_panel').style.transition = 'background-color .2s'
    document.getElementById('loading_panel').classList.add('loading_panel--hidden')
    setTimeout(() => {
      document.getElementById('loading_panel').style.display = 'none'
    })
  }, 300)
}

export default PanelManager
