import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import usePrevious from '@hooks/usePrevious.ts'
import p5Instance from '@utils/p5.js'
import { useSocket } from '@contexts/SocketContext';
import { useData } from "@contexts/DataContext";
import { Image, Path, ImageBase64, Vector2 } from "@classes";

interface props {
    isSocketConnect: Boolean,
    selfColor: string
    methodTypeValue: string
}

const DrawPanel = forwardRef((props: props, ref) => {
    useImperativeHandle(ref, () => ({
        pushNewImage(imageBase64: ImageBase64, action: (() => void) | null = null): void {
            p5Inst.current.loadImage(imageBase64.base64, (loadedImage: any) => {
                const image = new Image(loadedImage, imageBase64.pos, imageBase64.id)

                images.push(image)

                if (typeof action === 'function') { action() }
            })
        }
    }))
    const { socketRef } = useSocket()
    const { isSocketConnect, selfColor, methodTypeValue } = props
    const { images, paths } = useData()

    const fq: number = 10 // (ms)
    const fqInt = useRef<ReturnType<typeof setInterval> | null>()

    const currentPoint = useRef<any>(null)
    const isDrawing = useRef(false)

    const containerEl = useRef<HTMLDivElement>(null);
    const p5Inst = useRef<typeof p5Instance | null>(null)

    const selfColorRef = useRef<string>('#FFFFFF')
    const methodTypeValueRef = useRef<string>('')

    const currentPath = useRef<Path | null>()
    const currentSelect = useRef<Image | null>(null)
    const currentSelectObjectOffset = useRef<Vector2 | null>(null)
    const preMethodType = usePrevious<string>(methodTypeValue)

    class Draw {
        static start() {
            isDrawing.current = true
            currentPath.current = new Path(selfColorRef.current, socketRef.current.id)
            socketRef.current.emit('canvas-drawStart', { color: selfColorRef.current })
            paths.push(currentPath.current)

            fqInt.current = setInterval(() => {

                if (!currentPath.current || !currentPoint.current) { return }
                currentPath.current.path.push(currentPoint.current)
                socketRef.current.emit('canvas-drawing', { point: currentPoint.current })
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
            socketRef.current.emit('canvas-drawEnd')
        }
    }

    class Select {
        static get = () => {
            let _image

            for (let i = 0; i < images.length; i++) {
                const image = images[i]

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
                socketRef.current.emit('canvas-selectStart', { id: currentSelect.current.id, selectColor: selfColorRef.current })
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
                socketRef.current.emit('canvas-selectDragged', { id: currentSelect.current.id, pos })
            }
        }

        static end() {
            if (!currentSelect.current) { return }

            socketRef.current.emit('canvas-selectEnd', { id: currentSelect.current.id })
            currentSelect.current.selectColor = ''
            currentSelect.current = null
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
            startP5()
        } else {
            paths.length = 0
            images.length = 0
            currentPoint.current = null
            currentPath.current = null
            isDrawing.current = false
            currentSelectObjectOffset.current = null
            p5Inst.current?.remove()
        }
    }, [isSocketConnect])

    useEffect(() => {
        if (methodTypeValueRef.current !== methodTypeValue) {
            methodTypeValueRef.current = methodTypeValue
        }

        if (preMethodType === methodTypeValue) { return }

        if (!preMethodType || !(preMethodType in methodClass)) { return }
        const method = methodClass[preMethodType]
        if (method) {
            method.end()
        }
    }, [methodTypeValue])

    useEffect(() => {
        if (selfColorRef.current === selfColor) { return }

        selfColorRef.current = selfColor
    }, [selfColor])

    function startP5(): void {
        new p5Instance((p5: typeof p5Instance) => {
            p5Inst.current = p5

            p5.setup = () => {
                p5.createCanvas(containerEl.current?.offsetWidth, containerEl.current?.offsetHeight).parent(containerEl.current)
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

    const isInCanvas: () => boolean = () => {
        if (p5Inst.current.mouseX < 0 || p5Inst.current.mouseY < 0) { return false }

        if (!containerEl.current) { return true }

        if (p5Inst.current.mouseX > containerEl.current.offsetWidth || p5Inst.current.mouseY > containerEl.current.offsetHeight) { return false }

        return true
    }

    return (
        <div id="container" style={isSocketConnect ? { backgroundColor: '#FFFFFF' } : { backgroundColor: '#AAAAAA' }} ref={containerEl} className="mt-2 aspect-square w-full overflow-hidden border border-black"></div>
    );
})

export default DrawPanel;