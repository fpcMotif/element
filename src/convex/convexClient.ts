import { ConvexReactClient } from "convex/react";

import api from "../../convex/_generated/api";
import clientConfig from "../../convex/_generated/clientConfig";

const convexAddress = clientConfig.address;

export const convexClient = convexAddress ? new ConvexReactClient(convexAddress) : null;

export { api };
