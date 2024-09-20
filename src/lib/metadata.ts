import gcpMetadata from "gcp-metadata";
import { GoogleAuth } from "google-auth-library";

const auth = new GoogleAuth();

/**
 * Fetch GCP Project Id
 * @return {string} Project Id
 */
export async function fetchProjectId(): Promise<string> {
  // Use the 'google-auth-library' to make a request to the metadata server or
  // default to Application Default Credentials in your local environment.
  return auth.getProjectId();
}

/**
 * Fetch service region
 * @return {string | undefined} Region in format: projects/PROJECT_NUMBER/regions/REGION
 */
export async function fetchServiceRegion(): Promise<string | undefined> {
  let region: string | undefined;
  if (await gcpMetadata.isAvailable()) {
    region = await gcpMetadata.instance<string>("region");
  }
  return region;
}

/**
 * Make a request with an ID token to a protected service
 * https://github.com/googleapis/google-auth-library-nodejs#working-with-id-tokens
 * @param {string} url - receiving service URL
 * @param {string} method - request method
 * @return {GaxiosPromise<AxiosResponse>} request response
 */
export async function authenticatedRequest(url, method): Promise<unknown> {
  const client = await auth.getIdTokenClient(url);
  const response = await client.request({ url, method });
  return response;
}
