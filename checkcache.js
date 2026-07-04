require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);
sql`SELECT slug, content, created_at FROM learn_cache WHERE slug = 'how-ontarios-budget-works'`
  .then(r => console.log(JSON.stringify(r, null, 2)));
