/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'resources.tidal.com' },
      { protocol: 'https', hostname: '**.tidal.com' },
      { protocol: 'https', hostname: 'dabmusic.xyz' },
      { protocol: 'https', hostname: '**.dabmusic.xyz' },
      { protocol: 'https', hostname: '**' },
    ],
  },
}

export default nextConfig
