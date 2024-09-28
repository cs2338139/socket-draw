export class Path {
  color: string;
  id?: string | null;
  constructor(color: string = "#000000", id: string | null = null) {
    this.color = color;
    this.id = id;
  }

  path: any[] = [];
}
