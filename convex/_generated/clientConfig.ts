const deploymentUrl = process.env.CONVEX_URL ?? process.env.NEXT_PUBLIC_CONVEX_URL ?? "";

const clientConfig = {
    address: deploymentUrl,
};

export default clientConfig;
