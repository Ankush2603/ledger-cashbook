#!/usr/bin/env node

import dotenv from 'dotenv';
import { google } from 'googleapis';
import readline from 'readline';

dotenv.config();

console.log('🔍 Google Drive Folder Finder\n');

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  'urn:ietf:wg:oauth:2.0:oob'
);

// Generate auth URL with broader permissions to list folders
const scopes = [
  'https://www.googleapis.com/auth/drive.metadata.readonly',
  'https://www.googleapis.com/auth/drive.file'
];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: scopes,
  prompt: 'consent'
});

console.log('📋 Let\'s find your folder! Visit this URL:');
console.log(authUrl);
console.log('\nGrant permissions and provide the authorization code:\n');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('📝 Enter authorization code: ', async (code) => {
  try {
    console.log('\n⏳ Getting tokens...');
    
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    
    console.log('📁 Listing your Google Drive folders:\n');
    
    // List folders in Google Drive
    const response = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.folder'",
      fields: 'files(id, name, parents)',
      pageSize: 50
    });
    
    const folders = response.data.files;
    
    if (folders.length === 0) {
      console.log('No folders found in your Google Drive.');
      return;
    }
    
    console.log('Found folders:');
    console.log('=' .repeat(60));
    
    folders.forEach((folder, index) => {
      console.log(`${index + 1}. Name: ${folder.name}`);
      console.log(`   ID: ${folder.id}`);
      console.log(`   ${'-'.repeat(40)}`);
    });
    
    console.log('\n🎯 To use a folder:');
    console.log('1. Find your desired folder from the list above');
    console.log('2. Copy its ID');
    console.log('3. Update GOOGLE_DRIVE_FOLDER_ID in your .env file');
    console.log('4. Run the setup again');
    
    console.log('\n💡 Or create a new folder specifically for this app:');
    console.log('1. Go to Google Drive');
    console.log('2. Create a new folder (e.g., "Ledger-Cashbook-Data")');
    console.log('3. Open the folder and copy the ID from the URL');
    console.log('4. Use that ID in your .env file');
    
    // Also save the refresh token we got
    console.log(`\n📝 Your refresh token (add to .env): ${tokens.refresh_token}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  rl.close();
});