import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PGlite (Postgres embedded) tidak boleh di-bundle oleh webpack/Turbopack —
  // ia bergantung pada module Node (fs, path) dan protokol internal sendiri.
  serverExternalPackages: ["@electric-sql/pglite"],
};

export default nextConfig;
