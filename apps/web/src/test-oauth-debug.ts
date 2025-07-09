// OAuth Debug Test - Run this in browser console
// Go to https://morning-story-web.vercel.app/login
// Open DevTools console and paste this code

console.log('=== OAuth Debug Test ===');

// Check environment variables
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20) + '...');

// Test Supabase client
import { supabase } from './lib/supabase';

console.log('Supabase client:', supabase);

// Test OAuth configuration
async function testOAuth() {
  try {
    console.log('Testing OAuth configuration...');
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    
    console.log('OAuth response data:', data);
    console.log('OAuth response error:', error);
    
    if (error) {
      console.error('OAuth Error Details:', {
        message: error.message,
        name: error.name,
      });
    }
    
  } catch (err) {
    console.error('OAuth Test Error:', err);
  }
}

// Run the test
testOAuth();

console.log('=== End OAuth Debug ===');