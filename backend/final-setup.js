#!/usr/bin/env node

import dotenv from 'dotenv';
import { google } from 'googleapis';
import readline from 'readline';
import fs from 'fs';

dotenv.config();

console.log('🚀 Final Ledger Cashbook Setup - Auto Folder Creation\n');

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('❌ Error: Missing Google credentials in .env file');
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  'urn:ietf:wg:oauth:2.0:oob'
);

const scopes = ['https://www.googleapis.com/auth/drive.file'];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: scopes,
  prompt: 'consent'
});

console.log('📋 Final Setup - This will:');
console.log('✅ Create a secure "Ledger-Cashbook-Data" folder');
console.log('✅ Get refresh token');
console.log('✅ Test complete integration');
console.log('✅ Update your .env file automatically\n');

console.log('🔗 Visit this URL:');
console.log(authUrl);
console.log('\nGrant permissions and enter the code:\n');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('📝 Enter authorization code: ', async (code) => {
  try {
    console.log('\n⏳ Processing...');
    
    // Get tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    
    console.log('✅ Tokens received');
    
    // Create folder
    console.log('📁 Creating "Ledger-Cashbook-Data" folder...');
    
    const folderMetadata = {
      name: 'Ledger-Cashbook-Data',
      mimeType: 'application/vnd.google-apps.folder'
    };

    const folder = await drive.files.create({
      resource: folderMetadata,
      fields: 'id, name, webViewLink'
    });

    console.log('✅ Folder created successfully!');
    console.log(`📁 Name: ${folder.data.name}`);
    console.log(`🆔 ID: ${folder.data.id}`);
    console.log(`🔗 Link: ${folder.data.webViewLink}`);
    
    // Test file operations
    console.log('\n🧪 Testing file operations...');
    
    const testFile = await drive.files.create({
      resource: {
        name: 'setup-test.json',
        parents: [folder.data.id]
      },
      media: {
        mimeType: 'application/json',
        body: JSON.stringify({
          message: 'Ledger Cashbook setup successful!',
          timestamp: new Date().toISOString(),
          folderId: folder.data.id
        })
      }
    });
    
    console.log('✅ File creation test passed');
    
    // Read test
    const fileContent = await drive.files.get({
      fileId: testFile.data.id,
      alt: 'media'
    });
    
    console.log('✅ File read test passed');
    
    // Cleanup test file
    await drive.files.delete({ fileId: testFile.data.id });
    console.log('✅ File cleanup test passed');
    
    // Update .env file
    console.log('\n📝 Updating .env file...');
    
    let envContent = fs.readFileSync('.env', 'utf8');
    
    envContent = envContent.replace(
      /GOOGLE_REFRESH_TOKEN=.*/,
      `GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`
    );
    
    envContent = envContent.replace(
      /GOOGLE_DRIVE_FOLDER_ID=.*/,
      `GOOGLE_DRIVE_FOLDER_ID=${folder.data.id}`
    );
    
    fs.writeFileSync('.env', envContent);
    
    console.log('✅ .env file updated');
    
    console.log('\n🎉 SETUP COMPLETE!');
    console.log('═'.repeat(50));
    console.log('✅ Google Drive authentication configured');
    console.log('✅ Secure folder created with proper permissions');
    console.log('✅ All tests passed');
    console.log('✅ Environment variables updated');
    
    console.log('\n📁 Your Data Location:');
    console.log(`   Folder: ${folder.data.name}`);
    console.log(`   Link: ${folder.data.webViewLink}`);
    
    console.log('\n🚀 Next Steps:');
    console.log('1. Run: npm run dev (to start the backend server)');
    console.log('2. Your frontend can now connect to the backend');
    console.log('3. User data will be securely stored in Google Drive');
    
    console.log('\n🔒 Security:');
    console.log('✅ App only has access to files it creates');
    console.log('✅ Cannot access your existing Google Drive files');
    console.log('✅ All user data is isolated and secure');
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    if (error.message.includes('invalid_grant')) {
      console.log('\n💡 The authorization code expired. Please run the setup again.');
    }
  }
  
  rl.close();
});