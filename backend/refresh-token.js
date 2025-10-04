import { google } from 'googleapis';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

async function refreshGoogleToken() {
  console.log('🔄 Refreshing Google Drive token...');
  
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'urn:ietf:wg:oauth:2.0:oob'
  );

  try {
    // Set the refresh token
    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN
    });

    // Try to get an access token
    const { credentials } = await oauth2Client.refreshAccessToken();
    console.log('✅ Token refreshed successfully');
    console.log('Access token:', credentials.access_token ? '✅ Present' : '❌ Missing');
    console.log('Refresh token:', credentials.refresh_token ? '✅ Present' : '❌ Missing');

    // Test Drive API access
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    const about = await drive.about.get({ fields: 'user' });
    console.log('✅ Drive API access verified');
    console.log('User:', about.data.user.displayName, about.data.user.emailAddress);

    // Try to access the folder
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    if (folderId) {
      try {
        const folderInfo = await drive.files.get({ 
          fileId: folderId,
          fields: 'id, name, mimeType, owners'
        });
        console.log('✅ Folder access verified');
        console.log('Folder:', folderInfo.data.name, folderInfo.data.id);
      } catch (folderError) {
        console.log('❌ Cannot access folder:', folderError.message);
        console.log('🔧 Will create new folder during server startup');
      }
    }

    return true;
  } catch (error) {
    console.error('❌ Token refresh failed:', error.message);
    
    if (error.message.includes('invalid_grant')) {
      console.log('\n🚨 REFRESH TOKEN EXPIRED!');
      console.log('You need to generate a new refresh token.');
      console.log('Run: node get-auth-url.js');
      console.log('Then follow the authorization process again.');
    }
    
    return false;
  }
}

refreshGoogleToken()
  .then(success => {
    if (success) {
      console.log('\n✅ Google Drive authentication is working');
    } else {
      console.log('\n❌ Google Drive authentication failed');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });