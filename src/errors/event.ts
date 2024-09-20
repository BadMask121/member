import { logger } from "../lib/logger";

interface EventOptions {
  name: string;
  message?: string;
  [key: string]: unknown;
}

export class EventError<T = EventOptions> extends Error {
  innerError: T;

  constructor(private readonly options: T) {
    super();

    this.innerError = options;

    logger.debug(
      this.options,
      `[EVENT_ERROR::${(this.options as EventOptions)?.name}]: ${this.stack}`
    );
    Object.setPrototypeOf(this, Error.prototype);
  }
}
