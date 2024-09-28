import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react'
import { useData } from '@contexts/dataContext'

import ControlSection from '@components/ControlSection.tsx'
import ColorBar from '@components/ColorBar.tsx'
import DrawPanel from '@components/DrawPanel.tsx'
import { Vector2 } from "@classes/Vector2";
import { Image } from "@classes/Image";
import { Path } from "@classes/Path";
import { ImageBase64 } from "@classes/ImageBase64";

import { SocketFunction, socket } from '@classes/Socket.js'
import { MethodType } from '@interfaces/MethodType.ts'

function Panel() {
  const drawPanelRef = useRef<any>(null)
  const [isSocketConnect, setIsSocketConnect] = useState(false)
  const socketFunction = new SocketFunction()

  const [methodTypeValue, setMethodTypeValue] = useState<string>("")

  const [selfColor, setSelfColor] = useState<string>('#FFFFFF')
  const selfColorRef = useRef<string>('#FFFFFF')

  const { images, paths } = useData()

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

  useEffect(() => {
    if (isSocketConnect) {
      selfColorRef.current = `#${Math.floor(Math.random() * 16777215).toString(16)}`
      setSelfColor(selfColorRef.current)
    } else {
      setMethodTypeValue(methodTypeList.draw.value)
      selfColorRef.current = '#FFFFFF'
      setSelfColor(selfColorRef.current)

    }
  }, [isSocketConnect])


  function startSocket(): void {
    if (!isSocketConnect) {
      socketFunction.startSocket()

      socket.on('connect', () => {
        setIsSocketConnect(true)
      })

      socket.on('init', (object: { paths: Path[], imageBase64s: ImageBase64[] }) => {
        paths.push(...object.paths)
        const imageBase64s = object.imageBase64s

        setTimeout(() => {
          if (Array.isArray(imageBase64s)) {
            imageBase64s.forEach((imageBase64: ImageBase64) => {
              if (!drawPanelRef.current) { return }
              drawPanelRef.current.pushNewImage(imageBase64)
            })
          }
        }, 100)
      })

      socket.on('canvas-drawStart', (object: { color: string, id: string }) => {
        const path: Path = new Path(object.color, object.id)

        paths.push(path)
      })

      socket.on('canvas-drawing', (object: { id: string, point: any }) => {
        getItemToAction(paths, object.id, (path: Path) => { path.path.push(object.point) })
      })

      socket.on('canvas-drawEnd', (object: { id: string }) => {
        getItemToAction(paths, object.id, (path: Path) => { delete path.id })
      })

      socket.on('canvas-image', (object: ImageBase64) => {
        if (!drawPanelRef.current) { return }
        drawPanelRef.current.pushNewImage(object)
      })

      socket.on('canvas-selectStart', (object: { id: string, selectColor: string }) => {
        getItemToAction(images, object.id, (image: Image) => { image.selectColor = object.selectColor })
      })

      socket.on('canvas-selectDragged', (object: { id: string, pos: Vector2 }) => {
        getItemToAction(images, object.id, (image) => { image.pos = object.pos })
      })

      socket.on('canvas-selectEnd', (object: { id: string }) => {
        getItemToAction(images, object.id, (image: Image) => { image.selectColor = '' })
      })

      socket.on('disconnect', () => {
        setIsSocketConnect(false)
      })
    } else {
      socketFunction.disConnect()
      setIsSocketConnect(false)
    }
  }


  function getItemToAction<T>(list: T[], id: string, action: ((item: T) => void) | null = null): T | null {
    if (!Array.isArray(list)) { console.error('list is not array') }

    const item = list.find((x: any) => x?.id === id)

    if (!item) { return null }

    if (typeof action === 'function') { action(item) }

    return item
  }

  function handleImage(event: React.ChangeEvent<HTMLInputElement>): void {
    const file: File | undefined = event.target.files?.[0]

    if (file && file.type.startsWith('image')) {
      const reader = new FileReader()

      reader.onload = (e: ProgressEvent<FileReader>) => {
        const imageBase64: ImageBase64 = new ImageBase64(e.target?.result as string)
        if (!drawPanelRef.current) { return }
        drawPanelRef.current.pushNewImage(imageBase64, () => { socket.emit('canvas-image', imageBase64) })
      }
      reader.readAsDataURL(file)
    } else {
      console.error('Invalid file type. Please select an image.')
    }
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
      <DrawPanel
        ref={drawPanelRef}
        isSocketConnect={isSocketConnect}
        selfColor={selfColor}
        methodTypeValue={methodTypeValue}
      />

    </div >
  )
}

export default Panel
