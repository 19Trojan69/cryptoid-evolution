import { createApiGateway } from "../backend/src/apiGateway";

// A proxied deployment must not initialize a local MongoDB/session store.
export default createApiGateway(() => import("../backend/src/index"));
