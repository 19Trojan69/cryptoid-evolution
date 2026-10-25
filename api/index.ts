import { createApiGateway } from "../backend/src/apiGateway";
import { app, start, proxyAccountAllowed } from "../backend/src/index";

// Keep Vercel's proven static TypeScript module tracing for the backend.
export default createApiGateway(async () => ({ app, start, proxyAccountAllowed }));
