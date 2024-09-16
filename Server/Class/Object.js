//物件Class

export class PathData {
  constructor(color = "#000000", id = null) {
    this.color = color;
    this.id = id;
  }

  path = [];
}

export class ImageBase64 {
  constructor(base64, pos, id) {
    this.base64 = base64;
    this.pos = pos;
    this.id = id;
  }
  selectColor = "";
}
