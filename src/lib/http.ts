/* eslint-disable @typescript-eslint/no-explicit-any */
import { StatusCodes } from "http-status-codes";

import { Response, Request as ExpressRequest } from "express";
import { logger as log } from "./logger";

export enum HttpErrorType {
  NOT_FOUND = "not_found",
  BAD_REQUEST = "bad_request",
  SERVER_ERROR = "server_error",
  UNAUTHORIZED = "unauthorized_access",
}

export interface AppRequest<T> extends ExpressRequest {
  body: T;
}

export interface HttpResult<T> {
  result: T;
}

export interface HttpError<T extends HttpErrorType> {
  error: T;
  message: string;
}

export type HttpResponse<T = object | null | HttpErrorType> = T extends HttpErrorType
  ? HttpError<T>
  : HttpResult<T>;

// Utility functions
export function unauthorized(res: Response): Response<HttpResponse> {
  return res
    .status(StatusCodes.UNAUTHORIZED)
    .json({
      error: HttpErrorType.UNAUTHORIZED,
      message: "request not authorized",
    })
    .end();
}

export function serverError(res: Response, error?: Error): Response<HttpResponse> {
  log.fatal({ error });
  return res
    .status(StatusCodes.INTERNAL_SERVER_ERROR)
    .json({
      error: HttpErrorType.SERVER_ERROR,
      message: "unable to process request at this time",
    })
    .end();
}

export function badRequestError(
  res: Response,
  message?: string,
  reason?: Record<string, string> | string
): Response<HttpResponse> {
  return res
    .status(StatusCodes.BAD_REQUEST)
    .json({
      error: HttpErrorType.BAD_REQUEST,
      message: message || "unable to process request at this time",
      reason,
    })
    .end();
}

export function notFoundError<T = object | null | HttpErrorType>(
  res: Response,
  response: T
): Response<HttpResponse> {
  return res
    .status(StatusCodes.NOT_FOUND)
    .json({
      result: response || null,
    })
    .end();
}

export function result<T = object | null | HttpErrorType>(
  res: Response,
  response: T
): Response<HttpResponse> {
  return res.json({
    result: response || null,
  });
}
