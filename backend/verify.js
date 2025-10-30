const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Social Record Platform Installation...\n');

// Check package.json
const packagePath = path.join(__dirname, 'package.json');
if (fs.existsSync(packagePath)) {
  console.log('✅ Backend package.json found');
  const pkg = require('./package.json');
  console.log('   Dependencies:');
  Object.keys(pkg.dependencies).forEach(dep => {
    console.log(`   - ${dep}: ${pkg.dependencies[dep]}`);
  });
} else {
  console.log('❌ Backend package.json not found');
}

// Check .env file
console.log('\n📋 Environment Configuration:');
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  console.log('✅ .env file found');
  require('dotenv').config();
  
  const requiredEnvVars = ['PORT', 'DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
  const missingVars = requiredEnvVars.filter(v => !process.env[v]);
  
  if (missingVars.length > 0) {
    console.log(`⚠️  Missing environment variables: ${missingVars.join(', ')}`);
  } else {
    console.log('✅ All required environment variables are set');
  }
  
  if (process.env.GEMINI_API_KEY) {
    console.log('✅ Gemini API key is configured');
  } else {
    console.log('⚠️  Gemini API key not set (optional)');
  }
} else {
  console.log('❌ .env file not found. Please copy .env.example to .env');
}

// Check database connection
console.log('\n🗄️  Database Connection:');
const pool = require('./config/database');

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.log('❌ Database connection failed:', err.message);
    console.log('   Please check your PostgreSQL credentials in .env');
  } else {
    console.log('✅ Database connected successfully');
    console.log('   Server time:', res.rows[0].now);
    
    // Check if tables exist
    pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `, (err, res) => {
      if (err) {
        console.log('❌ Error checking tables:', err.message);
      } else if (res.rows.length === 0) {
        console.log('⚠️  No tables found. Run: npm run init-db');
      } else {
        console.log('✅ Database tables found:', res.rows.length);
        res.rows.forEach(row => console.log(`   - ${row.table_name}`));
      }
      
      console.log('\n✨ Verification complete!\n');
      console.log('📝 Next steps:');
      console.log('   1. If tables are missing, run: npm run init-db');
      console.log('   2. Start backend: npm run dev');
      console.log('   3. Start frontend: cd ../frontend && npm start');
      console.log('   4. Visit: http://localhost:3000\n');
      
      process.exit(0);
    });
  }
});
