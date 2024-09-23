import fs from "fs";

import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { Storage } = require("@google-cloud/storage");

export class WwebjsCloudStorage {
  storageKey = "";

  bucketName = "";

  clientId = "";

  storage;

  onSaved: ((arg0: unknown) => void) | undefined;

  isDebug = false;

  constructor(
    clientId: string,
    keyFile: string,
    bucketName: string,
    saved = undefined,
    isDebug = false
  ) {
    this.clientId = clientId;
    this.storageKey = keyFile;
    this.bucketName = bucketName;
    this.storage = new Storage();
    this.onSaved = saved;
    this.isDebug = isDebug;
    this.printConsole("wwebjs-google-cloud-storage Init");
  }

  async sessionExists(options: { session: unknown }): Promise<boolean> {
    this.printConsole(`${options.session} wwebjs-google-cloud-storage Session exists`);
    return this.internalExistFile(options);
  }

  async save(options: { session: unknown }): Promise<void> {
    await this.#deletePrevious(options);

    this.printConsole(`${options.session} wwebjs-google-cloud-storage Session save`);
    await new Promise<void>((resolve, reject) => {
      fs.createReadStream(`${options.session}.zip`)
        .pipe(
          this.storage.bucket(this.bucketName).file(`${options.session}.zip`).createWriteStream()
        )
        .on("error", (err) => {
          this.printConsole(`${options.session} wwebjs-google-cloud-storage Session save err`);
          this.printConsole(err);
          return reject(err);
        })
        .on("close", () => {
          if (this.onSaved !== undefined) {
            this.onSaved(options);
          }
          this.printConsole(`${options.session} wwebjs-google-cloud-storage Session save close`);
          return resolve();
        });
    });
  }

  async extract(options: { session: unknown; path: fs.PathLike }): Promise<void> {
    this.printConsole(`${options.session} wwebjs-google-cloud-storage Session extract`);

    return new Promise((resolve, reject) => {
      this.storage
        .bucket(this.bucketName)
        .file(`${options.session}.zip`)
        .createReadStream()
        .pipe(fs.createWriteStream(options.path))
        .on("error", (err) => {
          this.printConsole(`${options.session} wwebjs-google-cloud-storage Session err`);
          this.printConsole(err);
          return reject(err);
        })
        .on("close", () => resolve());
    });
  }

  async delete(options: { session: unknown }): Promise<void> {
    this.printConsole(`${options.session} wwebjs-google-cloud-storage Session delete`);
    if (await this.internalExistFile(options)) {
      await this.storage.bucket(this.bucketName).file(`${options.session}.zip`).delete();
    }
  }

  async #deletePrevious(options: { session: unknown }): Promise<void> {
    this.printConsole(`${options.session} wwebjs-google-cloud-storage Session delete previous`);
    if (await this.internalExistFile(options)) {
      await this.storage.bucket(this.bucketName).file(`${options.session}.zip`).delete();
    }
  }

  async internalExistFile(options: { session: unknown }): Promise<boolean> {
    this.printConsole(`${options.session} wwebjs-google-cloud-storage Session internal exists`);
    try {
      await this.storage.bucket(this.bucketName).file(`${options.session}.zip`).get();
      return true;
    } catch (error) {
      return false;
    }
  }

  printConsole(text: string | Error): void {
    if (!this.isDebug) {
      return;
    }

    console.log(text);
  }
}
