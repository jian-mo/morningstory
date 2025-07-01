import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { readFileSync } from 'fs'
import { join } from 'path'

export default defineConfig(({ mode }) => {
  // Load env file from root directory
  const envDir = resolve(__dirname, '../../')
  
  // Manually load .env.dev file for development
  const envDefine: Record<string, string> = {}
  
  if (mode === 'development') {
    try {
      const envDevPath = join(envDir, '.env.dev')
      const envDevContent = readFileSync(envDevPath, 'utf-8')
      
      // Parse .env.dev file manually
      envDevContent.split('\n').forEach(line => {
        const trimmedLine = line.trim()
        if (trimmedLine && !trimmedLine.startsWith('#')) {
          const [key, ...valueParts] = trimmedLine.split('=')
          const value = valueParts.join('=').replace(/^"(.*)"$/, '$1') // Remove quotes
          
          // Only expose VITE_ prefixed variables
          if (key?.startsWith('VITE_')) {
            envDefine[`import.meta.env.${key}`] = JSON.stringify(value)
          }
        }
      })
    } catch (error) {
      console.warn('Could not load .env.dev file:', error)
    }
  }
  
  return {
    plugins: [react()],
    define: envDefine, // Define environment variables
    envPrefix: ['VITE_'], // Only expose VITE_ prefixed variables to the client
    server: {
      port: 3001,
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        },
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test-setup.ts'],
      typecheck: {
        tsconfig: './tsconfig.test.json'
      }
    },
  }
})