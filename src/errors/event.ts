import { logger } from "../lib/logger";

interface EventOptions {
  botId: string;
  adminEmail: string;
  name: string;
  /**
   * if @param pushError is enabled, email with the error message will be set to group chat admin
   */
  pushError?: boolean;
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
