import { getStyle, setStyle } from "karma-ui/util/dom"
import clickoutside from "karma-ui/util/clickoutside.js"
// import esc from "karma-ui/util/esc.js"
export default {
  name: "KLayer",
  props: {
    gap: {
      type: Number,
      default: 2
    },
    hasTransition: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      transitionType: "slide-down",
      //相对于vm定位
      //vm是 定位的依据
      vm: null,
      //插入dom的位置
      parent: null,
      //$slots.default内容
      list: null,
      //header插槽
      headerSlots: null,
      //footer插槽
      footerSlots: null,
      //表签,默认div
      tag: "div",
      bodyTag: "div",
      headerTag: "div",
      footerTag: "div",
      //位置
      left: 0,
      top: -9999,
      //外部传入的layer宽度
      width: 0,
      //外部传入的layer高度
      height: 0,
      layerWidth: 0,
      vmHeight: 0,
      vmWidth: 0,
      layerHeight: 0,
      visible: false,
      //default插槽的class
      bodyClassName: "",
      //header插槽的class
      headerClassName: "",
      //footer插槽的class
      footerClassName: "",
      
      //此层如果位于可滚动元素内部，则需要计算滚动的位移量
      scrollElement: null,
      canCloseByClickoutside: false,
      whiteList: [],
      styles: {},
      afterEnter: () => {},
      afterLeave: () => {}
    }
  },
  computed: {
    transitionName() {
      return `k-transition-${this.transitionType}`
    }
  },
  provide() {
    return {
      layerComponent: this
    }
  },
  //下划线开始的，是内部方法。
  //不带下划线的，可供组件外部调用
  methods: {
    isObject: d =>
      Object.prototype.toString.call(d).toLowerCase() === "[object object]",
    //初始化，插入内容，并设置一些参数
    init(vm, slots, opts) {
      //opts是传入的参数，覆盖原有$data上的属性
      if (this.isObject(slots)) {
        this.list = slots.default || null
        this.headerSlots = slots.header || null
        this.footerSlots = slots.footer || null
      } else {
        this.list = slots
      }
      //className
      let bodyClasses = ["k-layer-body"]
      if (this.headerSlots) {
        bodyClasses.push("k-layer-has-header")
        this.headerClassName = "k-layer-header"
      }
      if (this.footerSlots) {
        bodyClasses.push("k-layer-has-footer")
        this.footerClassName = "k-layer-footer"
      }
      this.bodyClassName = bodyClasses.join(" ")

      this.vm = vm
      for (let k in opts) {
        if (opts[k]) {
          this.$data[k] = opts[k]
        }
      }
      // console.log(opts.whiteList)
      this.$nextTick().then(() => {
        this.calcLayerHeightAndGetPosition()
        this.$emit("layer-inited")
      })
    },
    //获取与layer相关的vm的$el的位置、尺寸信息
    _getElemPosition() {
      if (!this.vm || !this.vm.$el) {
        return
      }
      const elem = this.vm.$el
      if (!elem) {
        return null
      }
      const pos = elem.getBoundingClientRect()
      this.left = pos.left + window.pageXOffset
      this.top = pos.top + window.pageYOffset
      if (!this.width) {
        const w = getStyle(elem, "width")
        this.layerWidth = w
      } else {
        this.layerWidth = this.width
      }
      // if (!this.height) {
      const h = getStyle(elem, "height")
      this.vmHeight = h
      this.vmWidth = this.layerWidth
      // } else {
      //   this.vmHeight = this.height
      // }

      this._setSizeAndPosition()
    },
    _setSizeAndPosition() {
      //屏幕可视区高度
      const clientHeight = document.documentElement.clientHeight,
        clientWidth = document.documentElement.clientWidth
      //关联vm元素的底部距离屏幕最上边的高
      let top = this.top + parseFloat(this.vmHeight) + this.gap,
        left = this.left
      //layer本身的高度
      let height = this.layerHeight,
        // width = this.layerWidth
        width = parseFloat(getStyle(this.$el, "width"))

      //5是layer距离可视区边界的大小
      const wholeHeight = clientHeight + window.pageYOffset
      if (top + height > wholeHeight - 5) {
        top = wholeHeight - 5 - height
        if (top < 0) {
          top = 0
        }
      }
      // console.log(left,width,clientWidth)
      if (left + width > clientWidth - 5) {
        left = clientWidth - width - 5
        if (left < 0) {
          left = 0
        }
      }
      setStyle(this.$el, {
        width: this.layerWidth,
        top: top + "px",
        left: left + "px"
      })
      if (this.height) {
        setStyle(this.$el, {
          height: this.height
        })
      }
    },
    _handleEnter() {
      if (this.afterEnter) {
        this.afterEnter()
      }
    },
    _handleAfterLeave() {
      if (this.afterLeave) {
        this.afterLeave()
      }
    },

    show(callback) {
      this.visible = true
      this.afterEnter = () => {
        this.$nextTick(() => {
          // this.calcLayerHeightAndGetPosition()
          callback && callback()
        })
      }
    },
    hide(cb) {
      this.visible = false
      this.$emit("after-hide")
      if (cb && typeof cb === "function") {
        this.afterLeave = cb
      }
    },
    destroy() {
      this.$destroy()
    },
    calcLayerHeightAndGetPosition() {
      this.layerHeight = parseFloat(getStyle(this.$el, "height"))
      this._getElemPosition()
    },
    //检测外部容器的滚动，如果layer可视，且外部容器出现了滚动，则再次计算
    //layer位置
    handleScrollWrapper() {
      if(this.visible) {
        this._getElemPosition()
      }
    }
  },
  beforeDestroy() {
    window.removeEventListener("resize", this._getElemPosition)
    this.parent.removeChild(this.$el)
  },
  destroyed() {},
  mounted() {
    this.$nextTick(() => {
      this._getElemPosition()
      window.addEventListener("resize", this._getElemPosition)
    })
  },
  updated() {
    this.$nextTick(this._getElemPosition)
  },
  watch: {
    vm: "_getElemPosition",
    scrollElement(elem) {
      if(elem) {
        elem.addEventListener('scroll',this.handleScrollWrapper)
      }else{
        elem.removeEventListener('scroll',this.handleScrollWrapper)
      }
    }
  },
  directives: {
    clickoutside
    // esc
  },
  render() {
    let p = {
      attrs: {
        tabindex: -1
      },
      class: {
        "k-layer": true
      },
      on: {
        ...this.$listeners,
        mouseover: e => {
          this.$emit("mouseover", e)
        },
        mouseout: e => {
          this.$emit("mouseout", e)
        },
        mousedown: e => {
          this.$emit("mousedown", e)
        }
      },
      style: this.styles
    }
    let transitionProps = null
    if (this.hasTransition) {
      transitionProps = {
        on: {
          enter: this._handleEnter,
          "after-leave": this._handleAfterLeave
        },
        props: {
          name: "k-transition-slide-down"
        }
      }
      p.directives = [
        {
          name: "show",
          value: this.visible
        }
      ]
      if (this.canCloseByClickoutside) {
        const list = [this.vm.$el, ...this.whiteList]
        // console.log("layer组件接收到的whiteList", list)
        p.directives.push({
          name: "clickoutside",
          value: {
            fn: this.hide,
            whiteList: list
          }
        })
      }
    }
    const content = (
      <this.tag {...p}>
        {this.headerSlots ? (
          <this.headerTag
            class={{ [this.headerClassName]: !!this.headerClassName }}
          >
            {this.headerSlots}
          </this.headerTag>
        ) : null}

        <this.bodyTag
          ref="body"
          class={{ [this.bodyClassName]: !!this.bodyClassName }}
        >
          {this.list}
        </this.bodyTag>
        {this.footerSlots ? (
          <this.footerTag
            class={{ [this.footerClassName]: !!this.footerClassName }}
          >
            {this.footerSlots}
          </this.footerTag>
        ) : null}
      </this.tag>
    )
    if (this.hasTransition) {
      return <transition {...transitionProps}>{content}</transition>
    }
    return content
  }
}
