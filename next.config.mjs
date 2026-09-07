/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      // ExerciseDB GIFs (via RapidAPI)
      { protocol: 'https', hostname: 'v2.exercisedb.io' },
      { protocol: 'https', hostname: 'exercisedb.io' },
      // free-exercise-db images (GitHub raw)
      { protocol: 'https', hostname: 'raw.githubusercontent.com' },
      // Supabase Storage (project-specific)
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: '*.supabase.in' },
    ],
  },
};

export default nextConfig;
