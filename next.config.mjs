/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['sequelize', 'mysql2'],
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Handle Sequelize dialect resolution
      config.externals = config.externals || [];
      config.externals.push({
        'pg-hstore': 'commonjs pg-hstore',
        'pg': 'commonjs pg',
        'sqlite3': 'commonjs sqlite3',
        'better-sqlite3': 'commonjs better-sqlite3',
        'tedious': 'commonjs tedious',
        'mysql2': 'commonjs mysql2',
      });
    }
    
    return config;
  },
};

export default nextConfig; 