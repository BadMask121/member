import * as functions1 from "firebase-functions/v1";
import * as functions2 from "firebase-functions/v2";

export function createCallApi<R, U>(
  handler: (data: R, context: functions1.https.CallableContext) => U,
  options?: functions1.RuntimeOptions
): functions1.HttpsFunction & functions1.Runnable<unknown> {
  return functions1
    .runWith({ timeoutSeconds: 300, memory: "512MB", enforceAppCheck: true, ...options })
    .https.onCall(handler);
}

export function createCallApiV2<R, U>(
  handler: (request: functions2.https.CallableRequest<R>) => U,
  options?: functions2.https.CallableOptions
): functions2.https.CallableFunction<R, U extends Promise<unknown> ? U : Promise<U>> {
  return functions2.https.onCall(
    { timeoutSeconds: 300, memory: "512MiB", enforceAppCheck: true, ...options },
    handler
  );
}

export function createRequestApi<U extends void | Promise<void>>(
  handler: (request: functions2.https.Request, response: functions1.Response) => U,
  options?: functions2.https.HttpsOptions
): functions2.https.HttpsFunction {
  return functions2.https.onRequest({ timeoutSeconds: 300, ...options }, handler);
}
