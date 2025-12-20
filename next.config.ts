import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // บังคับใช้ Webpack
  turbopack: {},

  reactCompiler: false, // ปิด React Compiler ชั่วคราวเพื่อลดความซับซ้อน

  // จัดการ External Packages
  serverExternalPackages: [
    'mongodb', // MongoDB Native
    'bson'
  ],

  // Webpack Config
  webpack: (config) => {
    // ป้องกันการ load modules ที่ไม่จำเป็น
    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      'bufferutil': 'commonjs bufferutil',
    });
    return config;
  },
};

export default nextConfig;
