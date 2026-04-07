/** @type {import('next').NextConfig} */
const gatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:3000'

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/images/:path*',
        destination: `${gatewayUrl}/api/images/:path*`,
      },
    ]
  },
}

export default nextConfig
