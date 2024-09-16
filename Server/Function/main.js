//主要邏輯程式,組合Function
import { Unit } from "../Class/Unit.js";
import { event } from "../Data/enum.js";

export function mainStart() {
  Unit.Socket.io.on(event.on.connection, (socket) => {
    Unit.Log.connect(`${socket.id} is connect`);

    socket.emit(event.emit.init, { paths: Unit.store.paths, imageBase64s: Unit.store.imageBase64s });

    socket.on(event.on.canvasDrawStart, (object) => {
      object.id = socket.id;
      socket.broadcast.volatile.emit(event.emit.canvasDrawStart, object);
      const path = Unit.createPath(object.color, object.id);
      Unit.store.paths.push(path);
    });

    socket.on(event.on.canvasDrawing, (object) => {
      object.id = socket.id;
      socket.broadcast.volatile.emit(event.emit.canvasDrawing, object);

      Unit.getPath(socket.id, (path) => {
        path.path.push(object.point);
      });
    });

    socket.on(event.on.canvasDrawEnd, () => {
      socket.broadcast.volatile.emit(event.emit.canvasDrawEnd, { id: socket.id });

      Unit.getPath(socket.id, (path) => {
        delete path.id;
      });
    });

    socket.on(event.on.canvasImage, (object) => {
      socket.broadcast.emit(event.emit.canvasImage, object);
      const imageBase64 = Unit.createImageBase64(object.base64, object.pos, object.id);
      Unit.store.imageBase64s.push(imageBase64);
    });

    socket.on(event.on.canvasSelectStart, (object) => {
      socket.broadcast.emit(event.emit.canvasSelectStart, object);

      Unit.getImageBase64(object.id, (imageBase64) => {
        imageBase64.selectColor = object.selectColor;
      });
    });

    socket.on(event.on.canvasSelectDragged, (object) => {
      socket.broadcast.volatile.emit(event.emit.canvasSelectDragged, object);

      Unit.getImageBase64(object.id, (imageBase64) => {
        imageBase64.pos = object.pos;
      });
    });

    socket.on(event.on.canvasSelectEnd, (object) => {
      socket.broadcast.emit(event.emit.canvasSelectEnd, object);

      Unit.getImageBase64(object.id, (imageBase64) => {
        imageBase64.selectColor = "";
      });
    });

    socket.once(event.on.disconnect, () => {
      Unit.Log.disconnect(`${socket.id} is disconnect`);
    });
  });
}
