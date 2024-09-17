import { useEffect, useState, useRef, useMemo, useCallback } from 'react'
import usePrevious from './hook/usePrevious.js'
import { SocketFunction, socket } from './classes/Socket.js'

function App() {
  const [isSocketConnect, setIsSocketConnect] = useState(false)
  const socketFunction = new SocketFunction()
  const startBtn = useRef()
  const container = useRef()
  const fq = 10 // (ms)
  const fqInt = useRef()

  let _p5, p5

  const [methodTypeValue, setMethodTypeValue] = useState('MethodType')
  const preMethodType = usePrevious(methodTypeValue)

  const [selfColor, setSelfColor] = useState('#FFFFFF')
  const [isP5Ready, setIsP5Ready] = useState(false)

  let paths = []
  let currentPoint
  let currentPath = []
  const [isDrawing, setIsDrawing] = useState(false)

  let images = []

  const [currentSelect, setCurrentSelect] = useState(null)
  let currentSelectObjectOffset

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
      setIsDrawing(true)
      currentPath = new Path(selfColor, socket.id)
      socket.emit('canvas-drawStart', { color: selfColor })
      paths.push(currentPath)
    }

    static move() {
      if (!isInCanvas()) {
        this.end()

        return
      }

      currentPoint = p5.createVector(p5.mouseX, p5.mouseY)
    }

    static end() {
      if (!isDrawing) { return }

      setIsDrawing(false)
      delete currentPath.id
      currentPoint = null
      currentPath = null
      socket.emit('canvas-drawEnd')
    }
  }

  class Select {
    static get = () => {
      let _image

      for (let i = 0; i < images.length; i++) {
        const image = images[i]

        if (image.selectColor === '') {
          if (
            p5.mouseX > image.pos.x &&
            p5.mouseX < image.pos.x + image.image.width &&
            p5.mouseY > image.pos.y &&
            p5.mouseY < image.pos.y + image.image.height
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
        setCurrentSelect(image)
        currentSelectObjectOffset = new Vector2(p5.mouseX - currentSelect.pos.x, p5.mouseY - currentSelect.pos.y)
        currentSelect.selectColor = selfColor
        socket.emit('canvas-selectStart', { id: currentSelect.id, selectColor: selfColor })
      }
    }

    static move() {
      if (!isInCanvas()) {
        this.end()

        return
      }

      if (currentSelect === null) {
        return
      }

      const pos = new Vector2(p5.mouseX - currentSelectObjectOffset.x, p5.mouseY - currentSelectObjectOffset.y)

      currentSelect.pos = pos
      socket.emit('canvas-selectDragged', { id: currentSelect.id, pos })
    }

    static end() {
      if (!currentSelect) { return }

      socket.emit('canvas-selectEnd', { id: currentSelect.id })
      currentSelect.selectColor = ''
      setCurrentSelect(null)
    }
  }

  const methodType = {
    none: 'MethodType',
    draw: 'draw',
    select: 'select'
  }


  const methodClass = {
    draw: Draw,
    select: Select
  }

  useEffect(() => {

    import('p5').then((module) => {
      _p5 = module.default

      setIsP5Ready(true)
    })
  }, [])


  useEffect(() => {
    switch (isDrawing) {
      case true:
        fqInt.current = setInterval(() => {
          if (!currentPoint) { return }

          currentPath.path.push(currentPoint)
          socket.emit('canvas-drawing', { point: currentPoint })
        }, fq)
        break
      case false:
        clearInterval(fqInt.current)
        break
    }
  }, [isDrawing])

  useEffect(() => {
    if (isSocketConnect) {
      startBtn.current.innerHTML = 'disconnect'
      setSelfColor(`#${Math.floor(Math.random() * 16777215).toString(16)}`)

      if (isP5Ready) { startP5() }
    } else {
      startBtn.current.innerHTML = 'connect'
      setSelfColor('#FFFFFF')
      paths = []
      currentPoint = null
      currentPath = null
      setIsDrawing(false)
      images = []
      currentSelectObjectOffset = null
      p5?.remove()
    }
  }, [isSocketConnect])



  useEffect(() => {
    if (preMethodType === methodType.none) { return }
    const method = methodClass[preMethodType]

    method.end()
  }, [preMethodType])


  function startSocket() {
    if (!isSocketConnect) {
      socketFunction.startSocket()

      socket.on('connect', () => {
        setIsSocketConnect(true)
      })

      socket.on('init', (object) => {
        paths.push(...object.paths)
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

        paths.push(path)
      })

      socket.on('canvas-drawing', (object) => {
        getItemToAction(paths, object.id, (path) => { path.path.push(object.point) })
      })

      socket.on('canvas-drawEnd', (object) => {
        getItemToAction(paths, object.id, (path) => { delete path.id })
      })

      socket.on('canvas-image', (object) => {
        pushNewImage(object)
      })

      socket.on('canvas-selectStart', (object) => {
        getItemToAction(images, object.id, (image) => { image.selectColor = object.selectColor })
      })

      socket.on('canvas-selectDragged', (object) => {
        getItemToAction(images, object.id, (image) => { image.pos = object.pos })
      })

      socket.on('canvas-selectEnd', (object) => {
        getItemToAction(images, object.id, (image) => { image.selectColor = '' })
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
    // eslint-disable-next-line no-unused-vars
    const sketch = new _p5((p5Inst) => {
      p5 = p5Inst

      p5.setup = () => {
        p5.createCanvas(container.current.offsetWidth, container.current.offsetHeight).parent(container.current)
        p5.frameRate(30)
      }

      p5.draw = () => {
        p5.background(255)

        for (let i = 0; i < images.length; i++) {
          const image = images[i]

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

        for (let i = 0; i < paths.length; i++) {
          const path = paths[i].path

          p5.beginShape()
          p5.stroke(paths[i].color)

          for (let j = 0; j < path.length; j++) {
            p5.vertex(path[j].x, path[j].y)
          }

          p5.endShape()
        }
      }

      p5.mousePressed = () => {
        if (methodTypeValue === methodType.none) { return }

        if (!isInCanvas()) { return }

        const method = methodClass[methodTypeValue]

        method.start()
      }

      p5.mouseDragged = () => {
        if (methodTypeValue === methodType.none) { return }

        if (!isInCanvas()) { return }

        const method = methodClass[methodTypeValue]

        method.move()
      }

      p5.mouseReleased = () => {
        if (methodTypeValue === methodType.none) { return }

        if (!isInCanvas()) { return }

        const method = methodClass[methodTypeValue]

        method.end()
      }

      p5.windowResized = () => {
        p5.resizeCanvas(container.current.offsetWidth, container.current.offsetHeight)
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
    p5.loadImage(imageBase64.base64, (loadedImage) => {
      const image = new Image(loadedImage, imageBase64.pos, imageBase64.id)

      images.push(image)

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

    console.log(list, item)

    if (!item) { return null }

    console.log(typeof action === 'function')

    if (typeof action === 'function') { action(item) }

    return item
  }

  const isInCanvas = () => {
    if (p5.mouseX < 0 || p5.mouseY < 0) { return false }

    if (p5.mouseX > container.current.offsetWidth || p5.mouseY > container.current.offsetHeight) { return false }

    return true
  }

  const canvasBgStyle = useMemo(() => {
    return (isSocketConnect) ? 'bg-white' : 'bg-gray-300'
  }, [isSocketConnect])

  const selfColorStyle = useMemo(() => {
    return `background-color: ${selfColor}`
  }, [selfColor])

  return (
    <div className="m-10 border border-gray-400 px-10 py-5">
      <div className="flex items-center gap-5">
        <button ref={startBtn} className="border border-black px-3 py-1" onClick={startSocket}>
          connect
        </button>

        <select value={methodTypeValue} onChange={(e) => { setMethodTypeValue(e.target.value) }} className={`${isSocketConnect ? 'block' : 'hidden'} h-10 w-40 border border-black px-1 py-0.5 text-center text-lg text-black`}>
          <option disabled>
            MethodType
          </option>
          <option value={methodType.select}>
            Select
          </option>
          <option value={methodType.draw}>
            Draw
          </option>
        </select>

        <input className={`${isSocketConnect ? 'block' : 'hidden'}`} type="file" accept="image/*" onChange={handleImage} />
      </div >

      <div style={selfColorStyle} className="mt-2 h-5 w-full border border-black" ></div >
      <div id="container" ref={container} className={`mt-2 aspect-square w-full overflow-hidden border border-black ${canvasBgStyle}`}></div>

    </div >
  )
}

export default App
