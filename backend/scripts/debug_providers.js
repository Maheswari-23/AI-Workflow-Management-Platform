const { dbAll, dbGet } = require('../src/database/db');
const { decrypt } = require('../src/utils/crypto');

async function debugProviders() {
  try {
    console.log('🔍 Checking LLM Providers...');
    const providers = await dbAll('SELECT * FROM llm_providers');
    
    for (const p of providers) {
      const keyRaw = p.api_key || '';
      const decrypted = decrypt(keyRaw);
      console.log(`Provider: ${p.name}`);
      console.log(`- Is Default: ${p.is_default}`);
      console.log(`- Configured: ${p.configured}`);
      console.log(`- Key Length: ${keyRaw.length}`);
      console.log(`- Decrypted Key (Preview): ${decrypted ? decrypted.slice(0, 10) + '...' : 'EMPTY'}`);
      console.log(`- Base URL: ${p.base_url}`);
      console.log(`- Model: ${p.model}`);
      console.log('-------------------');
    }

    const defaultProvider = await dbGet('SELECT * FROM llm_providers WHERE is_default = 1 LIMIT 1');
    console.log(`Current Default Provider: ${defaultProvider ? defaultProvider.name : 'NONE'}`);

  } catch (err) {
    console.error('❌ Error debugging providers:', err.message);
  } finally {
    process.exit(0);
  }
}

debugProviders();
