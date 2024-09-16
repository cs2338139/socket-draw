

import { io } from 'socket.io-client'

import customParser from 'socket.io-msgpack-parser'

// socket實例
export let socket

export class SocketFunction {
  config = import.meta.env


  startSocket(password) {
    // socket連線
    console.log('socket url',this.config)
    socket = io(`${this.config.VITE_SOCKET_URL}`, {
      parser: customParser,
      auth: { password }
    })

    // 監聽連線失敗
    socket.on('connect_error', (error) => {
      console.error('連線錯誤:', error.message)
    })

    // 監聽連線
    socket.on('connect', () => {
      console.log(`client is connect : ${socket.id}`)
    })

    // 監聽斷線
    socket.on('disconnect', () => {
      window.location.reload()
      console.log('Disconnected from Socket.io server')
    })
  }

  disConnect() {
    socket.disconnect()
  }
}
