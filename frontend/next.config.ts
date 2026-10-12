import type { NextConfig } from "next";

// URL du backend Express (côté serveur uniquement)
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

const nextConfig: NextConfig = {
  // Le navigateur appelle /api/... sur Next, qui relaie vers Express.
  // Même origine : le cookie httpOnly est posé sur le domaine du frontend (pas de CORS).
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${BACKEND_URL}/api/:path*` }];
  },
};

export default nextConfig;
