// Test basic Supabase functionality
// Run this in browser console at https://morning-story-web.vercel.app/login

import { supabase } from './lib/supabase';

console.log('=== Supabase Connection Test ===');

async function testSupabaseConnection() {
  try {
    console.log('Testing Supabase connection...');
    
    // Test 1: Check if Supabase client is working
    console.log('Supabase client:', supabase);
    
    // Test 2: Try to get current session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    console.log('Current session:', sessionData);
    console.log('Session error:', sessionError);
    
    // Test 3: Try to sign up with email/password (this will test if Supabase auth is working)
    console.log('Testing email signup...');
    const testEmail = `test+${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });
    
    console.log('Signup data:', signupData);
    console.log('Signup error:', signupError);
    
    if (signupError) {
      console.error('Signup failed:', signupError.message);
    } else {
      console.log('✅ Supabase auth is working! The issue is specifically with OAuth.');
      
      // Clean up - sign out
      await supabase.auth.signOut();
      console.log('Signed out test user');
    }
    
  } catch (error) {
    console.error('Supabase test error:', error);
  }
}

// Run the test
testSupabaseConnection();

console.log('=== End Supabase Test ===');