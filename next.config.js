/**
 * @type {import('next').NextConfig}
 */

// const withPWA = require('next-pwa');
// const runtimeCaching = require('next-pwa/cache');
const { i18n } = require('./next-i18next.config');

const moduleExports = {
  api: {
    bodyParser: {
      sizeLimit: '1mb'
    }
  },
  // compiler: {
  //   removeConsole: {
  //     exclude: ['error', 'warn']
  //   }
  // },
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/admin/dashboard',
        permanent: true
      }
    ];
  },
  i18n,
  // pwa: {
  //   disable: process.env.NODE_ENV === 'development',
  //   dest: 'public',
  //   runtimeCaching
  // },
  reactStrictMode: true,
  images: {
    deviceSizes: [320, 420, 768, 1024, 1200],
    domains: ['127.0.0.1', 'ecom-bucket.fra1.digitaloceanspaces.com'],
    path: '/_next/image',
    loader: 'default'
  },
  env: {
    URL: 'https://ecom-website-vw8k.vercel.app',
    GTAG_MEASUREMENT_ID: '',
    FB_APPID: '',
    // DATABASE
    POSTGRES_USER: 'doadmin',
    POSTGRES_PASSWORD: 'AVNS_b_bPDDFxhgU4mPl21qW',
    POSTGRES_DB: 'production',
    PORT: 25060,
    DATABASE_END_POINT: 'db-postgresql-lon1-37795-do-user-9047386-0.b.db.ondigitalocean.com',
    // S3 BUCKET
    S3_BUCKET_NAME: 'ecom-bucket',
    S3_REGION: 'fra1',
    S3_ACCESS_KEY_ID: 'DO00H9TH8LTB7GVXQD2X',
    S3_SECRET_ACCESS_KEY: 'vgNsUneQXlOGcZP7blBiuxkh0AvKLBRQg5D5frE+dVo',
    S3_ENDPOINT: 'https://ecom-bucket.fra1.digitaloceanspaces.com'
  },
  typescript: {
    ignoreBuildErrors: true
  },
  eslint: {
    ignoreDuringBuilds: true
  }
};

module.exports = moduleExports

// module.exports = withSentryConfig(
//   withPWA(moduleExports),
//   SentryWebpackPluginOptions
// );
