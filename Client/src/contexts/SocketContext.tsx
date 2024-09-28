import { createContext, useContext, useRef } from "react";
import io, { Socket } from 'socket.io-client'; // Import Socket

import customParser from 'socket.io-msgpack-parser';

const SocketContext = createContext(
    { socketRef: null, socketFunction: {} } as { socketRef: any; socketFunction: any }
);

export const useSocket = () => {
    return useContext(SocketContext)
}

export function SocketContextProvider({ children }: { children: React.ReactNode }) {
    const config = import.meta.env
    // const [socket, setSocket] = useState<Socket | null>(null);
    const socketRef = useRef<Socket | null>(null)

    const socketFunction = {
        connect: (password: string): void => {
            // socket連線
            console.log('socket url', config)
            socketRef.current = io(`${config.VITE_SOCKET_URL}`, {
                parser: customParser,
                auth: { password }
            })

            console.log('socket', socketRef.current)

            // 監聽連線失敗
            socketRef.current.on('connect_error', (error: any) => {
                console.error('連線錯誤:', error.message)
            })

            // 監聽連線
            socketRef.current.on('connect', () => {
                console.log(`client is connect : ${socketRef.current?.id}`)
            })

            // 監聽斷線
            socketRef.current.on('disconnect', () => {
                window.location.reload()
                console.log('Disconnected from Socket.io server')
            })
        },

        disConnect: (): void => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        }
    }


    return (
        <SocketContext.Provider value={{ socketRef, socketFunction }} >
            {children}
        </SocketContext.Provider >
    )
}
