#!/usr/bin/env node

import dotenv from 'dotenv';
import { google } from 'googleapis';

dotenv.config();

console.log('🚀 Creating Ledger Cashbook Folder\n');

// Use the tokens we just got from the previous authorization
const tokens = {
  // We'll extract this from the previous setup
  refresh_token: null // Will be set from previous auth
};

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  'urn:ietf:wg:oauth:2.0:oob'
);

async function createAppFolder() {
  try {
    // We need to re-authorize with broader permissions first
    const scopes = [
      'https://www.googleapis.com/auth/drive.file'
    ];

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    });

    console.log('📋 One more authorization needed to create the folder:');
    console.log(authUrl);
    console.log('\n🔑 After granting permissions, I\'ll create the folder for you.');
    
    return authUrl;
  } catch (error) {
    console.error('Error:', error);
  }
}

createAppFolder();