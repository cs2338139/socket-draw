import { useEffect, useState, useRef, useMemo, useCallback } from 'react'
import usePrevious from './hook/usePrevious.js'
import p5Instance from './function/p5.js'

import { SocketFunction, socket } from './classes/Socket.js'

function App() {
  const [isSocketConnect, setIsSocketConnect] = useState(false)
  const socketFunction = new SocketFunction()
  const startBtnEl = useRef()
  const containerEl = useRef()
  const colorBarEl = useRef()

  const fq = 10 // (ms)
  const fqInt = useRef()

  const p5Inst = useRef(null)

  const [methodTypeValue, setMethodTypeValue] = useState()
  const methodTypeValueRef = useRef(methodTypeValue)
  const preMethodType = usePrevious(methodTypeValue)

  // const [isP5Ready, setIsP5Ready] = useState(false)
  const selfColor = useRef('#FFFFFF')

  const paths = useRef([])
  const currentPoint = useRef(null)
  const currentPath = useRef([])
  const isDrawing = useRef(false)

  const images = useRef([])

  const currentSelect = useRef(null)
  const currentSelectObjectOffset = useRef(null)

  class Path {
    constructor(color = '#000000', id = null) {
      this.color = color
      this.id = id
    }

    path = []
  }

  class Vector2 {
    constructor(x = 0, y = 0) {
      this.x = x
      this.y = y
    }
  }

  class Image {
    constructor(image, pos = new Vector2(), id) {
      this.image = image
      this.pos = pos
      this.id = id
    }

    selectColor = ''
  }

  class ImageBase64 {
    constructor(base64, pos = new Vector2()) {
      this.base64 = base64
      this.pos = pos
      this.id = getCreateImageUniId()
    }
  }

  class Draw {
    static start() {
      isDrawing.current = true
      currentPath.current = new Path(selfColor.current, socket.id)
      socket.emit('canvas-drawStart', { color: selfColor.current })
      paths.current.push(currentPath.current)

      fqInt.current = setInterval(() => {
        if (!currentPoint.current) { return }

        currentPath.current.path.push(currentPoint.current)
        socket.emit('canvas-drawing', { point: currentPoint.current })
      }, fq)
    }

    static move() {
      if (!isInCanvas()) {
        this.end()

        return
      }
      currentPoint.current = p5Inst.current.createVector(p5Inst.current.mouseX, p5Inst.current.mouseY)
    }

    static end() {
      if (!isDrawing.current) { return }
      clearInterval(fqInt.current)
      isDrawing.current = false
      delete currentPath.id
      currentPoint.current = null
      currentPath.current = null
      socket.emit('canvas-drawEnd')
    }
  }

  class Select {
    static get = () => {
      let _image

      for (let i = 0; i < images.current.length; i++) {
        const image = images.current[i]

        if (image.selectColor === '') {
          if (
            p5Inst.current.mouseX > image.pos.x &&
            p5Inst.current.mouseX < image.pos.x + image.image.width &&
            p5Inst.current.mouseY > image.pos.y &&
            p5Inst.current.mouseY < image.pos.y + image.image.height
          ) {
            _image = image
          }
        }
      }

      return _image
    }

    static start() {
      const image = Select.get()

      if (image) {
        currentSelect.current = image
        currentSelectObjectOffset.current = new Vector2(p5Inst.current.mouseX - currentSelect.current.pos.x, p5Inst.current.mouseY - currentSelect.current.pos.y)
        currentSelect.current.selectColor = selfColor.current
        socket.emit('canvas-selectStart', { id: currentSelect.current.id, selectColor: selfColor.current })
      }
    }

    static move() {
      if (!isInCanvas()) {
        this.end()

        return
      }

      if (currentSelect.current === null) {
        return
      }

      const pos = new Vector2(p5Inst.current.mouseX - currentSelectObjectOffset.current.x, p5Inst.current.mouseY - currentSelectObjectOffset.current.y)

      currentSelect.current.pos = pos
      socket.emit('canvas-selectDragged', { id: currentSelect.current.id, pos })
    }

    static end() {
      if (!currentSelect.current) { return }

      socket.emit('canvas-selectEnd', { id: currentSelect.current.id })
      currentSelect.current.selectColor = ''
      currentSelect.current = null
    }
  }

  const methodType = {
    draw: 'draw',
    select: 'select'
  }

  const methodClass = {
    draw: Draw,
    select: Select
  }


  useEffect(() => {
    if (isSocketConnect) {
      startBtnEl.current.innerHTML = 'disconnect'
      selfColor.current = `#${Math.floor(Math.random() * 16777215).toString(16)}`
      containerEl.current.style.backgroundColor = '#FFFFFF'
      colorBarEl.current.style.backgroundColor = selfColor.current

      // if (isP5Ready) { startP5() }
      startP5()
    } else {
      startBtnEl.current.innerHTML = 'connect'
      containerEl.current.style.backgroundColor = '#AAAAAA'
      setMethodTypeValue(methodType.draw)
      selfColor.current = '#FFFFFF'
      colorBarEl.current.style.backgroundColor = selfColor.current
      paths.current = []
      currentPoint.current = null
      currentPath.current = null
      // setIsDrawing(false)
      isDrawing.current = false
      images.current = []
      currentSelectObjectOffset.current = null
      p5Inst.current?.remove()
    }
  }, [isSocketConnect])

  useEffect(() => {
    methodTypeValueRef.current = methodTypeValue
    if (preMethodType === methodTypeValue) { return }

    const method = methodClass[preMethodType]
    if (method) {
      method.end()
    }
  }, [methodTypeValue])


  function startSocket() {
    if (!isSocketConnect) {
      socketFunction.startSocket()

      socket.on('connect', () => {
        setIsSocketConnect(true)
      })

      socket.on('init', (object) => {
        paths.current.push(...object.paths)
        const imageBase64s = object.imageBase64s

        setTimeout(() => {
          if (Array.isArray(imageBase64s)) {
            imageBase64s.forEach((imageBase64) => {
              pushNewImage(imageBase64)
            })
          }
        }, 100)
      })

      socket.on('canvas-drawStart', (object) => {
        const path = new Path(object.color, object.id)

        paths.current.push(path)
      })

      socket.on('canvas-drawing', (object) => {
        getItemToAction(paths.current, object.id, (path) => { path.path.push(object.point) })
      })

      socket.on('canvas-drawEnd', (object) => {
        getItemToAction(paths.current, object.id, (path) => { delete path.id })
      })

      socket.on('canvas-image', (object) => {
        pushNewImage(object)
      })

      socket.on('canvas-selectStart', (object) => {
        getItemToAction(images.current, object.id, (image) => { image.selectColor = object.selectColor })
      })

      socket.on('canvas-selectDragged', (object) => {
        getItemToAction(images.current, object.id, (image) => { image.pos = object.pos })
      })

      socket.on('canvas-selectEnd', (object) => {
        getItemToAction(images.current, object.id, (image) => { image.selectColor = '' })
      })

      socket.on('disconnect', () => {
        setIsSocketConnect(false)
      })
    } else {
      socketFunction.disConnect()
      setIsSocketConnect(false)
    }
  }

  function startP5() {
    new p5Instance((p5) => {
      p5Inst.current = p5

      p5.setup = () => {
        p5.createCanvas(containerEl.current.offsetWidth, containerEl.current.offsetHeight).parent(containerEl.current)
        p5.frameRate(30)
      }

      p5.draw = () => {
        p5.background(255)

        for (let i = 0; i < images.current.length; i++) {
          const image = images.current[i]

          p5.image(image.image, image.pos.x, image.pos.y, image.image.width, image.image.height)

          if (image.selectColor !== '') {
            p5.stroke(image.selectColor)
            p5.strokeWeight(5)
            p5.noFill()
            p5.rect(image.pos.x, image.pos.y, image.image.width, image.image.height)
          }
        }

        p5.strokeWeight(5)
        p5.noFill()

        for (let i = 0; i < paths.current.length; i++) {
          const path = paths.current[i].path

          p5.beginShape()
          p5.stroke(paths.current[i].color)

          for (let j = 0; j < path.length; j++) {
            p5.vertex(path[j].x, path[j].y)
          }

          p5.endShape()
        }
      }

      p5.mousePressed = () => {
        if (!isInCanvas()) { return }

        const method = methodClass[methodTypeValueRef.current]

        method.start()
      }

      p5.mouseDragged = () => {
        if (!isInCanvas()) { return }

        const method = methodClass[methodTypeValueRef.current]

        method.move()
      }

      p5.mouseReleased = () => {
        if (!isInCanvas()) { return }

        const method = methodClass[methodTypeValueRef.current]
        method.end()
      }

      p5.windowResized = () => {
        p5.resizeCanvas(containerEl.current.offsetWidth, containerEl.current.offsetHeight)
      }
    })
  }

  function handleImage(event) {
    const file = event.target.files[0]

    if (file && file.type.startsWith('image')) {
      const reader = new FileReader()

      reader.onload = (e) => {
        const imageBase64 = new ImageBase64(e.target.result)

        pushNewImage(imageBase64, () => { socket.emit('canvas-image', imageBase64) })
      }
      reader.readAsDataURL(file)
    } else {
      console.error('Invalid file type. Please select an image.')
    }
  }

  function pushNewImage(imageBase64, action = null) {
    p5Inst.current.loadImage(imageBase64.base64, (loadedImage) => {
      const image = new Image(loadedImage, imageBase64.pos, imageBase64.id)

      images.current.push(image)

      if (typeof action === 'function') { action() }
    })
  }

  const getCreateImageUniId = () => {
    const currentTime = new Date().getTime()
    const random = Math.floor(Math.random() * 500)

    return `${currentTime}-${random}`
  }

  function getItemToAction(list, id, action = null) {
    if (!Array.isArray(list)) { console.error('list is not array') }

    const item = list.find(x => x?.id === id)

    if (!item) { return null }

    if (typeof action === 'function') { action(item) }

    return item
  }

  const isInCanvas = () => {
    if (p5Inst.current.mouseX < 0 || p5Inst.current.mouseY < 0) { return false }

    if (p5Inst.current.mouseX > containerEl.offsetWidth || p5Inst.current.mouseY > containerEl.current.offsetHeight) { return false }

    return true
  }

  return (
    <div className="m-10 border border-gray-400 px-10 py-5">
      <div className="flex items-center gap-5">
        <button ref={startBtnEl} className="border border-black px-3 py-1" onClick={startSocket}>
          connect
        </button>

        <select value={methodTypeValue} onChange={(e) => { setMethodTypeValue(e.target.value) }} className={`${isSocketConnect ? 'block' : 'hidden'} h-10 w-40 border border-black px-1 py-0.5 text-center text-lg text-black`}>
          <option value={methodType.draw}>
            Draw
          </option>
          <option value={methodType.select}>
            Select
          </option>
        </select>

        <input className={`${isSocketConnect ? 'block' : 'hidden'}`} type="file" accept="image/*" onChange={handleImage} />
      </div >

      <div ref={colorBarEl} className="mt-2 h-5 w-full border border-black" ></div >
      <div id="container" ref={containerEl} className="mt-2 aspect-square w-full overflow-hidden border border-black"></div>

    </div >
  )
}

export default App
