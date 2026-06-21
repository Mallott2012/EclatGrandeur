/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The entire catalogue is rendered with a procedural SVG jewellery engine,
  // so there are no remote image hosts to whitelist.
  images: {
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;
