#!/usr/bin/env node

import dotenv from 'dotenv';
import { google } from 'googleapis';

dotenv.config();

console.log('🚀 Completing Google Drive Setup with Authorization Code...\n');

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const AUTH_CODE = '4/1AVGzR1CCeXioomJi5eB1otRsRt2LmdehnjAJtYYqmpPcR9R310_enyXGYek';

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  'urn:ietf:wg:oauth:2.0:oob'
);

async function completeSetup() {
  try {
    console.log('⏳ Exchanging code for tokens...');
    
    const { tokens } = await oauth2Client.getToken(AUTH_CODE);
    
    console.log('✅ Success! Received tokens');
    
    // Test the connection
    oauth2Client.setCredentials(tokens);
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    
    console.log('🧪 Testing Google Drive connection...');
    
    await drive.files.list({ pageSize: 1 });
    console.log('✅ Google Drive connection successful!');
    
    // Create the main folder
    console.log('📁 Creating main data folder...');
    
    const folderMetadata = {
      name: 'Ledger-Cashbook-Data',
      mimeType: 'application/vnd.google-apps.folder'
    };

    const folder = await drive.files.create({
      resource: folderMetadata,
      fields: 'id'
    });

    console.log('✅ Main folder created successfully!');
    console.log(`Folder ID: ${folder.data.id}`);
    console.log(`Refresh Token: ${tokens.refresh_token}\n`);
    
    console.log('📝 Configuration to add to .env file:');
    console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
    console.log(`GOOGLE_DRIVE_FOLDER_ID=${folder.data.id}\n`);
    
    // Return the values for automatic update
    return {
      refreshToken: tokens.refresh_token,
      folderId: folder.data.id
    };
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    throw error;
  }
}

// Export for use or run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  completeSetup()
    .then((result) => {
      console.log('🎉 Setup complete! Backend is ready to use.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Setup failed:', error);
      process.exit(1);
    });
}

export { completeSetup };