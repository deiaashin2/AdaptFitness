require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

console.log('Testing Supabase Connection...\n');

console.log('URL:', supabaseUrl);
console.log('Key:', supabaseAnonKey ? 'Found (hidden for security)' : 'Missing');

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('\nMissing the required Anonkey in .env file');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('\nSupabase client created successfully!');