import { setStyle, getStyle, offset } from 'karma-ui/util/dom.js'
export class Dnd {
  //如果有parent参数，则拖拽范围是parent内
  constructor(el, handler, parent) {
    this.dx = 0
    this.dy = 0
    this.el = el
    this.handler = handler
    this.parent = parent
    this.eventDown = this.eventDown.bind(this)
    this.eventMove = this.eventMove.bind(this)
    this.eventUp = this.eventUp.bind(this)
    this.bindEvent()
  }
  bindEvent() {
    this.handler.addEventListener('mousedown', this.eventDown)
  }
  eventDown(e) {
    const offsetLeft = this.parent
      ? offset(this.el, this.parent).left
      : offset(this.el).left
    const offsetTop = this.parent
      ? offset(this.el, this.parent).top
      : offset(this.el).top
    const position = getStyle(this.el, 'position')
    if (position === 'static' || position === 'relative') {
      setStyle(this.el, {
        position: 'absolute',
      })
    }
    setStyle(this.handler, {
      cursor: 'move',
    })
    setStyle(this.el, {
      left: offsetLeft + 'px',
      top: offsetTop + 'px',
      margin: 'auto',
    })
    setStyle(document.body, {
      userSelect: 'none',
    })
    this.dx = e.clientX - offsetLeft
    this.dy = e.clientY - offsetTop
    document.addEventListener('mousemove', this.eventMove)
    document.addEventListener('mouseup', this.eventUp)
  }
  eventMove(e) {
    setStyle(this.el, {
      top: e.clientY - this.dy + 'px',
      left: e.clientX - this.dx + 'px',
    })
  }
  eventUp(e) {
    setStyle(this.handler, {
      cursor: 'default',
    })
    setStyle(document.body, {
      userSelect: 'auto',
    })
    document.removeEventListener('mousemove', this.eventMove)
    document.removeEventListener('mouseup', this.eventUp)
  }
  destroy() {
    this.handler.removeEventListener('mousedown', this.eventDown)
  }
}
