import {defineConfig,Config} from 'drizzle-kit';

export default defineConfig({
  schema:'./src/schema.ts',
  out:'./drizzle',
  dialect:'sqlite',
  strict:true,
  dbCredentials:{
    url:'./data.db'
  }
} as Config);