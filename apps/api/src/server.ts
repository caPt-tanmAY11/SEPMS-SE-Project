import { app } from './app';
import { config } from './config';

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 SEPMS Backend API running on http://localhost:${PORT}`);
  console.log(`📡 Environment: ${config.nodeEnv}`);
  console.log(`🔒 Supabase URL: ${config.supabase.url || 'Not configured (offline mode)'}`);
  console.log(`🗄️ Database: ${config.database.url ? 'PostgreSQL (live)' : 'In-memory test mock'}`);
  console.log(`====================================================`);
});
