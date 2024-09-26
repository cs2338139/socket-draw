import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return{
    plugins: [react()],
    server: {
      port: parseInt(env.VITE_PORT),
    },
    resolve: {
      alias: {
        '@components': path.resolve(__dirname, 'src/components'),
        '@utils': path.resolve(__dirname, 'src/utils'),
        '@hooks': path.resolve(__dirname, 'src/hooks'),
        '@functions': path.resolve(__dirname, 'src/functions'),
        '@classes': path.resolve(__dirname, 'src/classes'),
        '@assets': path.resolve(__dirname, 'src/assets'),
        '@interfaces': path.resolve(__dirname, 'src/interfaces'),
      },
    },
  }
})
