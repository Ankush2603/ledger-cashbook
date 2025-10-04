#!/usr/bin/env node

import dotenv from 'dotenv';
import { google } from 'googleapis';
import readline from 'readline';

dotenv.config();

console.log('🚀 Ledger Cashbook - Specific Folder Setup\n');

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;

if (!CLIENT_ID || !CLIENT_SECRET || !FOLDER_ID) {
  console.error('❌ Error: Missing required environment variables');
  console.log('Please ensure these are set in your .env file:');
  console.log('- GOOGLE_CLIENT_ID');
  console.log('- GOOGLE_CLIENT_SECRET');
  console.log('- GOOGLE_DRIVE_FOLDER_ID');
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  'urn:ietf:wg:oauth:2.0:oob'
);

// Generate auth URL with restricted scopes
const scopes = [
  'https://www.googleapis.com/auth/drive.file'  // Only files created by the app
];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: scopes,
  prompt: 'consent'
});

console.log('📁 Using your specific folder: ' + FOLDER_ID);
console.log('🔒 Security: App will only access files it creates\n');

console.log('📋 Setup Instructions:');
console.log('1. Visit this URL in your browser:');
console.log(`   ${authUrl}\n`);
console.log('2. Grant permissions (you may see a security warning - click "Advanced" then "Go to Ledger Cashbook")');
console.log('3. Copy the authorization code from the browser');
console.log('4. Paste it below when prompted\n');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('📝 Enter the authorization code: ', async (code) => {
  try {
    console.log('\n⏳ Exchanging code for tokens...');
    
    const { tokens } = await oauth2Client.getToken(code);
    
    console.log('✅ Success! Received tokens\n');
    
    // Test the connection and folder access
    oauth2Client.setCredentials(tokens);
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    
    console.log('🧪 Testing Google Drive connection...');
    
    try {
      // Test folder access
      const folderInfo = await drive.files.get({ 
        fileId: FOLDER_ID,
        fields: 'id, name, mimeType'
      });
      
      console.log('✅ Folder access successful!');
      console.log(`   Folder Name: ${folderInfo.data.name}`);
      console.log(`   Folder ID: ${folderInfo.data.id}\n`);
      
      // Test file creation in the folder
      console.log('🧪 Testing file creation in your folder...');
      
      const testFile = await drive.files.create({
        resource: {
          name: 'ledger-test-file.json',
          parents: [FOLDER_ID]
        },
        media: {
          mimeType: 'application/json',
          body: JSON.stringify({ test: 'Ledger Cashbook setup test', timestamp: new Date().toISOString() })
        }
      });
      
      console.log('✅ Test file created successfully!');
      
      // Clean up test file
      await drive.files.delete({ fileId: testFile.data.id });
      console.log('✅ Test file cleaned up\n');
      
      console.log('📝 Add this to your .env file:');
      console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}\n`);
      
      console.log('🎉 Setup complete! Your backend is ready to use.');
      console.log('\n📋 Data will be stored in your Google Drive folder:');
      console.log(`   ${folderInfo.data.name} (${FOLDER_ID})`);
      console.log('\n🔒 Security: The app can only access files it creates in this folder');
      
    } catch (error) {
      console.error('❌ Folder access test failed:', error.message);
      if (error.code === 404) {
        console.log('\n💡 Possible solutions:');
        console.log('1. Check if the folder ID is correct');
        console.log('2. Ensure the folder exists in your Google Drive');
        console.log('3. Make sure the folder is not in Trash');
      }
    }
    
  } catch (error) {
    console.error('❌ Error getting tokens:', error.message);
    if (error.message.includes('invalid_grant')) {
      console.log('\n💡 The authorization code may have expired or already been used.');
      console.log('Please run this setup again to get a fresh code.');
    }
  }
  
  rl.close();
});

export { authUrl };