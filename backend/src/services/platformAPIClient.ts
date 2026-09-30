import axios from "axios";
import env from "../environments";

const createClient = (apiKey: string) => axios.create({
  baseURL: env.platform_api_url,
  timeout: 20000,
  headers: { "Authorization": `Key ${apiKey}` },
});

const platformAPIClient = createClient(env.pi_api_key);
const testnetPlatformAPIClient = env.pi_testnet_api_key
  ? createClient(env.pi_testnet_api_key)
  : null;

export const platformAPIClientForRequest = (req: { headers?: Record<string, unknown> }) => {
  const requestedNetwork = String(req.headers?.["x-cryptoid-app-network"] || "").toLowerCase();

  if (requestedNetwork === "testnet") {
    if (!testnetPlatformAPIClient) {
      throw new Error("PI_TESTNET_API_KEY is not configured");
    }
    return testnetPlatformAPIClient;
  }

  return platformAPIClient;
};

export default platformAPIClient;
