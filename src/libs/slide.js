export default class Slide {
  constructor(panel, touchHandleId, panelHandleId, options = {}) {
    this.options = options
    this.panel = panel
    this.speed = 0
    this.pos = 0
    this.panelHandleId = panelHandleId
    this.touchHandleId = touchHandleId

    this.bounds = options.bounds || {top : 0, bottom : 0}
    this.multiplier = options.multiplier || 1
  }

  initListeners() {
    this.touchHandle = document.getElementById(this.touchHandleId)
    this.panelHandle = document.querySelector(`[data-cid="${this.panelHandleId}"]`)

    this.touchHandle.ontouchstart= (e) => {
      this.slideStart(e)
    }

    document.ontouchend = (e) => {
      this.slideEnd(e)
    }

    document.ontouchmove = (e) => {
      this.slideMove(e)
    }
  }

  slideStart(e) {
    this.initPos = e.touches[0].pageY
  }

  slideEnd() {
    if(this.speed < -10) {
      this.pos = 0
      this.panelHandle.style.transform = `translate3d(0,${-this.pos}px,0)`
    } else if(this.speed > 10) {
      this.pos = -(this.panelHandle.getBoundingClientRect().height - this.bounds.bottom)
      this.panelHandle.style.transform = `translate3d(0,${-this.pos}px,0)`
    }
  }

  slideMove(e) {
    this.speed =  e.touches[0].pageY - this.initPos
    this.initPos =  e.touches[0].pageY
    this.pos -= this.speed
    if(this.pos > 0) {
      this.pos = 0
    }
    if(this.pos < -(this.panelHandle.getBoundingClientRect().height - this.bounds.bottom)) {
      this.pos = -(this.panelHandle.getBoundingClientRect().height - this.bounds.bottom)
    }
    this.panelHandle.style.transform = `translate3d(0,${-this.pos}px, 0)`
  }
}
