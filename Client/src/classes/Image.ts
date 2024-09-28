import { Vector2 } from "@classes/Vector2";

export class Image {
  image: any;
  pos: Vector2;
  id: string;
  constructor(image: any, pos: Vector2 = new Vector2(), id: string) {
    this.image = image;
    this.pos = pos;
    this.id = id;
  }

  selectColor = "";
}
