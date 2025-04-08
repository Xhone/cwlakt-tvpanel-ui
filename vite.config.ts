import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import * as https from 'https'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  },
  base: './', // 设置基础路径
  server: {
    host: true, // 监听所有地址
    port: 8080,
    open: true, // 自动打开浏览器
    cors: true, // 允许跨域
    proxy: {
      '/api': {
        target: 'https://localhost:44379/', // 这里改成你的.NET Core API地址
        changeOrigin: true,
        secure:false,
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure:(proxy,options)=>{
          proxy.on("error",(err,req,res)=>{
            console.log('proxy error', err);
          });
          proxy.on("proxyReq",(proxyReq,req,res)=>{
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
        agent:new https.Agent({
          rejectUnauthorized: false // 允许自签名证书
        })
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    chunkSizeWarningLimit: 2000,
    rollupOptions:{
      external:["config.json"],
      output:{
        manualChunks:{
          vendor:['vue','vue-router','axios'], // 将这些库单独打包成一个chunk
        },
        assetFileNames:(assetInfo)=> {
          if(assetInfo.name==='config.json'){
            return 'config/[name][extname]'; // 将config.json放在config目录下
          }
          return 'assets/[name]-[hash][extname]'; // 其他资源文件放在assets目录下
        }
      }
    }
  }
})