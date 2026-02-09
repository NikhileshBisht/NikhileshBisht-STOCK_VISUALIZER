require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function testSupabase() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    console.log('Testing Supabase connection...');
    console.log('URL:', supabaseUrl);
    console.log('Key (first 10 chars):', supabaseKey ? supabaseKey.substring(0, 10) : 'MISSING');

    if (!supabaseUrl || !supabaseKey) {
        console.error('Missing Supabase URL or Key in .env');
        return;
    }

    try {
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Try to select from users table
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .limit(1);

        if (error) {
            console.error('Supabase Error:', error);
        } else {
            console.log('Success! Connection worked. Users found:', data?.length);
        }
    } catch (err) {
        console.error('Unexpected Error:', err);
    }
}

testSupabase();
