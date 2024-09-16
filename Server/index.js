import { createServer } from "http";
// import { createServer } from "https";
import { Server } from "socket.io";
import customParser from "socket.io-msgpack-parser";
import { instrument } from "@socket.io/admin-ui";
import { Unit } from "./Class/Unit.js";

const httpServer = createServer();

//Server設定
Unit.Socket.io = new Server(httpServer, {
  //二進制
  parser: customParser,
  //cors
  cors: {
    origin: Unit.setting.connect.corsUrl,
    methods: ["GET", "POST", "PUT", "HEAD", "GETPUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  },
});

//UI介面設定
instrument(Unit.Socket.io, {
  auth: {
    type: Unit.setting.adminUI.type,
    username: Unit.setting.adminUI.username,
    password: Unit.setting.adminUI.password,
    // password: await Unit.Tool.getToHash(setting.adminUI.password),  //  <-- not good
  },
  // auth: false
});

Unit.Socket.io.listen(Unit.setting.connect.port, console.log(`server is start: cors : ${Unit.setting.connect.corsUrl}, Server socket : ${Unit.setting.connect.port}`));


Unit.mainStart();
