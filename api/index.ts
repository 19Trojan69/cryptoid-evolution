import { createApiGateway } from "../backend/src/apiGateway";
import { app, start } from "../backend/src/index";

// Keep Vercel's proven static TypeScript module tracing for the backend.
export default createApiGateway(async () => ({ app, start }));
