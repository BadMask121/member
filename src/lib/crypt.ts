import * as crypto from "crypto";

export class Encrypter {
  static algorithm = "aes256";

  static genKeyBuffer(key: string): Buffer {
    return crypto.scryptSync(key, "salt", 32);
  }

  static encrypt(clearText: string, key: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(Encrypter.algorithm, Encrypter.genKeyBuffer(key), iv);
    const encrypted = cipher.update(clearText, "utf8", "hex");
    return [encrypted + cipher.final("hex"), Buffer.from(iv).toString("hex")].join("|");
  }

  static decrypt(encryptedText: string, key: string): string {
    const [encrypted, iv] = encryptedText.split("|");
    if (!iv) throw new Error("IV not found");
    const decipher = crypto.createDecipheriv(
      Encrypter.algorithm,
      Encrypter.genKeyBuffer(key),
      Buffer.from(iv, "hex")
    );
    return decipher.update(encrypted, "hex", "utf8") + decipher.final("utf8");
  }
}
