/** @type {import('next').NextConfig} */
const nextConfig = {
  // Your other config can go here
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**', // This allows any path from this hostname
      },
      // You can add more domains here if needed
      // {
      //   protocol: 'https',
      //   hostname: 'another-domain.com',
      // },
    ],
  },
};

export default nextConfig;
