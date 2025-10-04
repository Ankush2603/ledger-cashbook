#!/usr/bin/env node

import dotenv from 'dotenv';
import { google } from 'googleapis';
import readline from 'readline';

dotenv.config();

console.log('🚀 Ledger Cashbook Backend Setup\n');

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('❌ Error: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in .env file');
  console.log('\nPlease:');
  console.log('1. Go to https://console.cloud.google.com/');
  console.log('2. Create a new project or select existing project');
  console.log('3. Enable Google Drive API');
  console.log('4. Create OAuth 2.0 credentials');
  console.log('5. Add your credentials to .env file');
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  'urn:ietf:wg:oauth:2.0:oob'
);

// Generate auth URL
const scopes = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.metadata'
];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: scopes,
});

console.log('📋 Setup Instructions:');
console.log('1. Visit this URL in your browser:');
console.log(`   ${authUrl}\n`);
console.log('2. Grant permissions to your application');
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
    
    console.log('✅ Success! Your refresh token is:');
    console.log(`   ${tokens.refresh_token}\n`);
    
    console.log('📝 Add this to your .env file:');
    console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}\n`);
    
    // Test the connection
    oauth2Client.setCredentials(tokens);
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    
    console.log('🧪 Testing Google Drive connection...');
    
    try {
      await drive.files.list({ pageSize: 1 });
      console.log('✅ Google Drive connection successful!');
      
      // Create the main folder
      console.log('\n📁 Creating main data folder...');
      
      const folderMetadata = {
        name: 'Ledger-Cashbook-Data',
        mimeType: 'application/vnd.google-apps.folder'
      };

      const folder = await drive.files.create({
        resource: folderMetadata,
        fields: 'id'
      });

      console.log('✅ Main folder created successfully!');
      console.log(`📝 Add this to your .env file:`);
      console.log(`GOOGLE_DRIVE_FOLDER_ID=${folder.data.id}\n`);
      
      console.log('🎉 Setup complete! Your backend is ready to use.');
      console.log('\n📋 Next steps:');
      console.log('1. Update your .env file with the tokens shown above');
      console.log('2. Run: npm install');
      console.log('3. Run: npm run dev');
      
    } catch (error) {
      console.error('❌ Google Drive test failed:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error getting tokens:', error.message);
  }
  
  rl.close();
});