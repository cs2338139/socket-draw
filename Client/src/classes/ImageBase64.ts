import { Vector2 } from "@classes/Vector2";
import { getCreateImageUniId } from "@utils/getCreateImageUniId";

export class ImageBase64 {
  base64: string;
  pos: Vector2;
  id: string;
  constructor(base64: string, pos: Vector2 = new Vector2()) {
    this.base64 = base64;
    this.pos = pos;
    this.id = getCreateImageUniId();
  }
}
