//Unit function,中控入口
import { setting } from "../Data/setting.js";
import { Socket } from "./Socket.js";
import { store } from "../Data/store.js";
import { PathData, ImageBase64 } from "./Object.js";
import { mainStart } from "../Function/main.js";
import { event } from "../Data/enum.js";
import { Log } from "./Log.js";
import { Tool } from "./Tool.js";

export class Unit {
  static mainStart = mainStart;

  static Socket = Socket;

  static Log = Log;

  static Tool = Tool;

  static setting = setting;

  static store = store;

  static getCurrentDate() {
    var currentDate = new Date();

    var taiwanTime = currentDate.toLocaleString("zh-TW", { timeZone: "Asia/Taipei" });

    return taiwanTime;
  }

  static createPath(color, id) {
    return new PathData(color, id);
  }

  static createImageBase64(base64, pos, id) {
    return new ImageBase64(base64, pos, id);
  }

  static getPath(id, action = null) {
    const path = Unit.store.paths.find((x) => x?.id === id);

    if (!path) return null;
    if (typeof action === "function") action(path);
    return path;
  }

  static getImageBase64(id, action = null) {
    const imageBase64 = store.imageBase64s.find((x) => x?.id === id);

    if (!imageBase64) return null;
    if (typeof action === "function") action(imageBase64);
    return imageBase64;
  }
}
