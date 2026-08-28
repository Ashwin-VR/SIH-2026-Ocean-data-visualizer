import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
export default defineConfig({plugins:[react()],server:{host:'0.0.0.0',port:9000,proxy:{'/api':'http://127.0.0.1:9001','/ogc':'http://127.0.0.1:9001','/earth':'http://127.0.0.1:9001'}},build:{sourcemap:true},test:{environment:'node'}})
