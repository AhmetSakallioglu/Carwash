import { setDefaultResultOrder } from "node:dns";
import type { NextConfig } from "next";

try {
  setDefaultResultOrder("ipv4first");
} catch {
  // ignore
}

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  serverExternalPackages: ["@supabase/supabase-js", "@supabase/ssr"],
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
