//外部工具
import bcrypt from "bcryptjs";

export class Tool {
  //取得Hash code
  static async getToHash(password) {
    const saltRounds = 10;

    try {
      const hash = await bcrypt.hash(password, saltRounds);
      return hash;
    } catch (error) {
      console.error("error:", error);
      throw error;
    }
  }

  //取得Hash code核對
  static async getCompareHash(password, hashCode) {
    try {
      const res = await bcrypt.compare(password, hashCode);
      return res;
    } catch (error) {
      console.error("error:", error);
      throw error;
    }
  }
}
