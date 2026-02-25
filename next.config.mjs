/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export',
    distDir: 'gh-page-output',
    trailingSlash: true,
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    images: {
        unoptimized: true
    },
    async generateBuildId() {
        return 'build'
    }
}

export default nextConfig
