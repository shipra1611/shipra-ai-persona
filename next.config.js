/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    
    GITHUB_TOKEN: process.env.GITHUB_TOKEN,
    GITHUB_USERNAME: process.env.GITHUB_USERNAME,
  },
}

module.exports = nextConfig
