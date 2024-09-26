import { useEffect, useState, useRef, useMemo, useCallback } from 'react'
import usePrevious from '@hooks/usePrevious.ts'
import p5Instance from '@functions/p5.js'

import ControlSection from '@components/ControlSection.tsx'
import ColorBar from '@components/colorBar.tsx'

import { SocketFunction, socket } from '@classes/Socket.js'
import { MethodType } from '@interfaces/MethodType.ts'

function App() {
  const [isSocketConnect, setIsSocketConnect] = useState(false)
  const socketFunction = new SocketFunction()
  const containerEl = useRef<HTMLDivElement>(null)

  const fq: number = 10 // (ms)
  const fqInt = useRef<ReturnType<typeof setInterval> | null>()

  const p5Inst = useRef<typeof p5Instance | null>(null)

  const [methodTypeValue, setMethodTypeValue] = useState<string>("")
  const methodTypeValueRef = useRef<string>(methodTypeValue)
  const preMethodType = usePrevious<string>(methodTypeValue)

  const [selfColor, setSelfColor] = useState<string>('#FFFFFF')
  const selfColorRef = useRef<string>('#FFFFFF')

  const paths = useRef<Path[]>([])
  const currentPoint = useRef<any>(null)
  const currentPath = useRef<Path | null>()
  const isDrawing = useRef(false)

  const images = useRef<Image[]>([])

  const currentSelect = useRef<Image | null>(null)
  const currentSelectObjectOffset = useRef<Vector2 | null>(null)

  class Path {
    color: string;
    id?: string | null;
    constructor(color: string = '#000000', id: string | null = null) {
      this.color = color
      this.id = id
    }

    path: any[] = []
  }

  class Vector2 {
    x: number;
    y: number;

    constructor(x: number = 0, y: number = 0) {
      this.x = x
      this.y = y
    }
  }

  class Image {
    image: any;
    pos: Vector2;
    id: string;
    constructor(image: any, pos: Vector2 = new Vector2(), id: string) {
      this.image = image
      this.pos = pos
      this.id = id
    }

    selectColor = ''
  }

  class ImageBase64 {
    base64: string;
    pos: Vector2;
    id: string;
    constructor(base64: string, pos: Vector2 = new Vector2()) {
      this.base64 = base64
      this.pos = pos
      this.id = getCreateImageUniId()
    }
  }

  class Draw {
    static start() {
      isDrawing.current = true
      currentPath.current = new Path(selfColorRef.current, socket.id)
      socket.emit('canvas-drawStart', { color: selfColorRef.current })
      paths.current.push(currentPath.current)

      fqInt.current = setInterval(() => {

        if (!currentPath.current || !currentPoint.current) { return }
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
      if (fqInt.current) {
        clearInterval(fqInt.current)
      }

      isDrawing.current = false
      if (currentPath.current) {
        delete currentPath.current.id;
      }

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
        currentSelect.current.selectColor = selfColorRef.current
        socket.emit('canvas-selectStart', { id: currentSelect.current.id, selectColor: selfColorRef.current })
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

      if (currentSelectObjectOffset.current) {
        const pos = new Vector2(p5Inst.current.mouseX - currentSelectObjectOffset.current.x, p5Inst.current.mouseY - currentSelectObjectOffset.current.y)
        currentSelect.current.pos = pos
        socket.emit('canvas-selectDragged', { id: currentSelect.current.id, pos })
      }
    }

    static end() {
      if (!currentSelect.current) { return }

      socket.emit('canvas-selectEnd', { id: currentSelect.current.id })
      currentSelect.current.selectColor = ''
      currentSelect.current = null
    }
  }

  const methodTypeList: { [key: string]: MethodType } = {
    draw: {
      name: 'Draw',
      value: 'draw'
    },
    select: {
      name: 'Select',
      value: 'select'
    }
  }

  interface MethodClass {
    draw: typeof Draw;
    select: typeof Select;
    [key: string]: any;
  }

  const methodClass: MethodClass = {
    draw: Draw,
    select: Select
  }


  useEffect(() => {
    if (isSocketConnect) {
      if (!containerEl.current) { return }
      selfColorRef.current = `#${Math.floor(Math.random() * 16777215).toString(16)}`
      containerEl.current.style.backgroundColor = '#FFFFFF'
      setSelfColor(selfColorRef.current)

      startP5()
    } else {
      if (!containerEl.current) { return }
      containerEl.current.style.backgroundColor = '#AAAAAA'
      setMethodTypeValue(methodTypeList.draw.value)
      selfColorRef.current = '#FFFFFF'
      setSelfColor(selfColorRef.current)
      paths.current = []
      currentPoint.current = null
      currentPath.current = null
      isDrawing.current = false
      images.current = []
      currentSelectObjectOffset.current = null
      p5Inst.current?.remove()
    }
  }, [isSocketConnect])

  useEffect(() => {
    methodTypeValueRef.current = methodTypeValue
    if (preMethodType === methodTypeValue) { return }

    if (!preMethodType || !(preMethodType in methodClass)) { return }
    const method = methodClass[preMethodType]
    if (method) {
      method.end()
    }
  }, [methodTypeValue])


  function startSocket(): void {
    if (!isSocketConnect) {
      socketFunction.startSocket()

      socket.on('connect', () => {
        setIsSocketConnect(true)
      })

      socket.on('init', (object: { paths: Path[], imageBase64s: ImageBase64[] }) => {
        paths.current.push(...object.paths)
        const imageBase64s = object.imageBase64s

        setTimeout(() => {
          if (Array.isArray(imageBase64s)) {
            imageBase64s.forEach((imageBase64: ImageBase64) => {
              pushNewImage(imageBase64)
            })
          }
        }, 100)
      })

      socket.on('canvas-drawStart', (object: { color: string, id: string }) => {
        const path: Path = new Path(object.color, object.id)

        paths.current.push(path)
      })

      socket.on('canvas-drawing', (object: { id: string, point: any }) => {
        getItemToAction(paths.current, object.id, (path: Path) => { path.path.push(object.point) })
      })

      socket.on('canvas-drawEnd', (object: { id: string }) => {
        getItemToAction(paths.current, object.id, (path: Path) => { delete path.id })
      })

      socket.on('canvas-image', (object: ImageBase64) => {
        pushNewImage(object)
      })

      socket.on('canvas-selectStart', (object: { id: string, selectColor: string }) => {
        getItemToAction(images.current, object.id, (image: Image) => { image.selectColor = object.selectColor })
      })

      socket.on('canvas-selectDragged', (object: { id: string, pos: Vector2 }) => {
        getItemToAction(images.current, object.id, (image) => { image.pos = object.pos })
      })

      socket.on('canvas-selectEnd', (object: { id: string }) => {
        getItemToAction(images.current, object.id, (image: Image) => { image.selectColor = '' })
      })

      socket.on('disconnect', () => {
        setIsSocketConnect(false)
      })
    } else {
      socketFunction.disConnect()
      setIsSocketConnect(false)
    }
  }

  function startP5(): void {
    new p5Instance((p5: typeof p5Instance) => {
      p5Inst.current = p5

      p5.setup = () => {
        p5.createCanvas(containerEl.current?.offsetWidth, containerEl.current?.offsetHeight).parent(containerEl.current)
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
          // console.log(path)
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
        p5.resizeCanvas(containerEl.current?.offsetWidth, containerEl.current?.offsetHeight)
      }
    })
  }

  function handleImage(event: React.ChangeEvent<HTMLInputElement>): void {
    const file: File | undefined = event.target.files?.[0]

    if (file && file.type.startsWith('image')) {
      const reader = new FileReader()

      reader.onload = (e: ProgressEvent<FileReader>) => {
        const imageBase64: ImageBase64 = new ImageBase64(e.target?.result as string)

        pushNewImage(imageBase64, () => { socket.emit('canvas-image', imageBase64) })
      }
      reader.readAsDataURL(file)
    } else {
      console.error('Invalid file type. Please select an image.')
    }
  }

  function pushNewImage(imageBase64: ImageBase64, action: (() => void) | null = null): void {
    p5Inst.current.loadImage(imageBase64.base64, (loadedImage: any) => {
      const image = new Image(loadedImage, imageBase64.pos, imageBase64.id)

      images.current.push(image)

      if (typeof action === 'function') { action() }
    })
  }

  const getCreateImageUniId: () => string = () => {
    const currentTime = new Date().getTime()
    const random = Math.floor(Math.random() * 500)

    return `${currentTime}-${random}`
  }

  function getItemToAction<T>(list: T[], id: string, action: ((item: T) => void) | null = null): T | null {
    if (!Array.isArray(list)) { console.error('list is not array') }

    const item = list.find((x: any) => x?.id === id)

    if (!item) { return null }

    if (typeof action === 'function') { action(item) }

    return item
  }

  const isInCanvas: () => boolean = () => {
    if (p5Inst.current.mouseX < 0 || p5Inst.current.mouseY < 0) { return false }

    if (!containerEl.current) { return true }

    if (p5Inst.current.mouseX > containerEl.current.offsetWidth || p5Inst.current.mouseY > containerEl.current.offsetHeight) { return false }

    return true
  }

  return (
    <div className="m-10 border border-gray-400 px-10 py-5">
      <ControlSection
        isSocketConnect={isSocketConnect}
        startSocket={startSocket}
        methodTypeValueProps={{ methodTypeValue, setMethodTypeValue }}
        methodTypeList={methodTypeList}
        handleImage={handleImage}
      />

      <ColorBar color={selfColor} />
      <div id="container" ref={containerEl} className="mt-2 aspect-square w-full overflow-hidden border border-black"></div>

    </div >
  )
}

export default App
