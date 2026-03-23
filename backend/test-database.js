require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

async function testDatabase() {
    console.log('Testing Database Connection...\n');

    try {
        // Test 1: Check if we can access data from the SQL tables
        const { data: tables, error } = await supabase
            .from('profiles')
            .select('*')
            .limit(1);

        if (error) {
            // Check if there are no rows
            if (error.code === 'PGRST116') {
                console.log('Database connected!');
            } else {
                console.error('Database error:', error.message);
                return;
            }
        } else {
            console.log('Database connected!');
            if (tables && tables.length > 0) {
                console.log('Found existing data:', tables.length, 'profile(s)');
            } else {
                console.log('Tables exist!');
            }
        }

    } catch (err) {
        console.error('Connection failed :( :', err.message);
        process.exit(1);
    }
}

testDatabase();