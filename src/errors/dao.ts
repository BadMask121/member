import { logger } from "../lib/logger";

interface DaoOptions {
  name: string;
  message?: string;
  [key: string]: unknown;
}

export class DaoError<T = DaoOptions> extends Error {
  innerError: T;

  constructor(private readonly options: T) {
    super();

    this.innerError = options;

    logger.debug(this.options, `[DAO_ERROR::${(this.options as DaoOptions)?.name}]: ${this.stack}`);
    Object.setPrototypeOf(this, Error.prototype);
  }
}
