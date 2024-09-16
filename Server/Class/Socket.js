//Socket相關
export class Socket {
  //server實例
  static io;

  static getAllClientCount = () => {
    return this.io.engine.clientsCount;
  };
}
