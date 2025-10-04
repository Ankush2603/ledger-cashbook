import { google } from 'googleapis';
import { v4 as uuidv4 } from 'uuid';

export class GoogleDriveService {
  constructor() {
    this.auth = null;
    this.drive = null;
    this.initialized = false;
    this.initPromise = this.initializeAuth();
  }

  async ensureInitialized() {
    if (!this.initialized) {
      try {
        await this.initPromise;
        this.initialized = true;
      } catch (error) {
        console.error('❌ Google Drive initialization failed:', error.message);
        throw new Error('Google Drive service unavailable');
      }
    }
  }

  // Initialize Google Drive authentication
  async initializeAuth() {
    try {
      this.auth = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        'urn:ietf:wg:oauth:2.0:oob' // For installed applications
      );

      // Set refresh token if available
      if (process.env.GOOGLE_REFRESH_TOKEN) {
        this.auth.setCredentials({
          refresh_token: process.env.GOOGLE_REFRESH_TOKEN
        });

        // Test and refresh the token immediately
        try {
          const { credentials } = await this.auth.refreshAccessToken();
          console.log('✅ Google Drive token refreshed successfully');
        } catch (refreshError) {
          console.error('❌ Failed to refresh Google Drive token:', refreshError.message);
          throw new Error('Google Drive token refresh failed');
        }
      }

      this.drive = google.drive({ version: 'v3', auth: this.auth });
    } catch (error) {
      console.error('Failed to initialize Google Drive auth:', error);
      throw new Error('Google Drive authentication failed');
    }
  }

  // Ensure the main folder exists and get its ID
  async ensureFolderExists() {
    await this.ensureInitialized();
    
    try {
      const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
      
      // If folder ID is provided, try to use it
      if (folderId && folderId !== '') {
        try {
          const folderInfo = await this.drive.files.get({ 
            fileId: folderId,
            fields: 'id, name, mimeType'
          });
          
          console.log(`✅ Using existing folder: ${folderInfo.data.name} (${folderId})`);
          return folderId;
        } catch (error) {
          console.warn(`⚠️  Cannot access folder ${folderId}: ${error.message}`);
          console.log('📁 Creating new folder instead...');
        }
      }

      // Create new folder if no ID provided or existing folder inaccessible
      console.log('📁 Creating new "Ledger-Cashbook-Data" folder...');
      
      const folderMetadata = {
        name: 'Ledger-Cashbook-Data',
        mimeType: 'application/vnd.google-apps.folder'
      };

      const folder = await this.drive.files.create({
        resource: folderMetadata,
        fields: 'id, name, webViewLink'
      });

      const newFolderId = folder.data.id;
      console.log(`✅ Created new folder: ${folder.data.name} (${newFolderId})`);
      console.log(`🔗 Folder link: ${folder.data.webViewLink}`);
      
      // Update environment variable for future use
      console.log(`💡 Update your .env file with: GOOGLE_DRIVE_FOLDER_ID=${newFolderId}`);
      
      return newFolderId;
    } catch (error) {
      console.error('❌ Error ensuring folder exists:', error);
      throw error;
    }
  }

  // Create a new user file in Google Drive
  async createUser(userData) {
    try {
      const folderId = await this.ensureFolderExists();
      const userId = uuidv4();
      
      const userFileData = {
        ...userData,
        id: userId
      };

      const fileMetadata = {
        name: `user_${userId}.json`,
        parents: [folderId]
      };

      const media = {
        mimeType: 'application/json',
        body: JSON.stringify(userFileData, null, 2)
      };

      const file = await this.drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id'
      });

      console.log('Created user file with ID:', file.data.id);
      return userFileData;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Find user by email
  async getUserByEmail(email) {
    try {
      const folderId = await this.ensureFolderExists();
      
      // Search for user files in the folder
      const response = await this.drive.files.list({
        q: `'${folderId}' in parents and name contains 'user_' and mimeType='application/json'`,
        fields: 'files(id, name)'
      });

      // Check each user file for matching email
      for (const file of response.data.files) {
        try {
          const fileData = await this.drive.files.get({
            fileId: file.id,
            alt: 'media'
          });
          
          // Convert response data to string if it's a buffer
          let dataString = fileData.data;
          if (Buffer.isBuffer(dataString)) {
            dataString = dataString.toString('utf8');
          } else if (typeof dataString === 'object') {
            dataString = JSON.stringify(dataString);
          }
          
          const userData = JSON.parse(dataString);
          if (userData.email === email) {
            userData.fileId = file.id;
            return userData;
          }
        } catch (error) {
          console.warn(`Error reading user file ${file.name}:`, error.message);
        }
      }

      return null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  }

  // Get user by ID
  async getUserById(userId) {
    try {
      const folderId = await this.ensureFolderExists();
      
      const response = await this.drive.files.list({
        q: `'${folderId}' in parents and name='user_${userId}.json'`,
        fields: 'files(id, name)'
      });

      if (response.data.files.length === 0) {
        return null;
      }

      const file = response.data.files[0];
      const fileData = await this.drive.files.get({
        fileId: file.id,
        alt: 'media'
      });

      // Convert response data to string if it's a buffer
      let dataString = fileData.data;
      if (Buffer.isBuffer(dataString)) {
        dataString = dataString.toString('utf8');
      } else if (typeof dataString === 'object') {
        dataString = JSON.stringify(dataString);
      }

      const userData = JSON.parse(dataString);
      userData.fileId = file.id;
      return userData;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      throw error;
    }
  }

  // Update user's last login time
  async updateUserLastLogin(userId) {
    try {
      const user = await this.getUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      user.lastLogin = new Date().toISOString();
      
      const media = {
        mimeType: 'application/json',
        body: JSON.stringify(user, null, 2)
      };

      await this.drive.files.update({
        fileId: user.fileId,
        media: media
      });

      return user;
    } catch (error) {
      console.error('Error updating user last login:', error);
      throw error;
    }
  }

  // Get user's ledger data
  async getUserLedgerData(userId) {
    try {
      const folderId = await this.ensureFolderExists();
      
      const response = await this.drive.files.list({
        q: `'${folderId}' in parents and name='ledger_${userId}.json'`,
        fields: 'files(id, name)'
      });

      if (response.data.files.length === 0) {
        return null; // No ledger data found
      }

      const file = response.data.files[0];
      const fileData = await this.drive.files.get({
        fileId: file.id,
        alt: 'media'
      });

      // Convert response data to string if it's a buffer
      let dataString = fileData.data;
      if (Buffer.isBuffer(dataString)) {
        dataString = dataString.toString('utf8');
      } else if (typeof dataString === 'object') {
        dataString = JSON.stringify(dataString);
      }

      return JSON.parse(dataString);
    } catch (error) {
      if (error.code === 404) {
        return null; // File not found
      }
      console.error('Error getting ledger data:', error);
      throw error;
    }
  }

  // Save user's ledger data
  async saveLedgerData(userId, ledgerData) {
    try {
      const folderId = await this.ensureFolderExists();
      const fileName = `ledger_${userId}.json`;
      
      // Check if file already exists
      const existingFiles = await this.drive.files.list({
        q: `'${folderId}' in parents and name='${fileName}'`,
        fields: 'files(id, name)'
      });

      const media = {
        mimeType: 'application/json',
        body: JSON.stringify(ledgerData, null, 2)
      };

      if (existingFiles.data.files.length > 0) {
        // Update existing file
        const fileId = existingFiles.data.files[0].id;
        await this.drive.files.update({
          fileId: fileId,
          media: media
        });
      } else {
        // Create new file
        const fileMetadata = {
          name: fileName,
          parents: [folderId]
        };

        await this.drive.files.create({
          resource: fileMetadata,
          media: media,
          fields: 'id'
        });
      }

      return ledgerData;
    } catch (error) {
      console.error('Error saving ledger data:', error);
      throw error;
    }
  }

  // Create backup of user data
  async createBackup(userId) {
    try {
      const folderId = await this.ensureFolderExists();
      const ledgerData = await this.getUserLedgerData(userId);
      
      if (!ledgerData) {
        throw new Error('No ledger data found to backup');
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `backup_${userId}_${timestamp}.json`;

      const fileMetadata = {
        name: backupFileName,
        parents: [folderId]
      };

      const media = {
        mimeType: 'application/json',
        body: JSON.stringify({
          ...ledgerData,
          backupCreatedAt: new Date().toISOString(),
          originalUserId: userId
        }, null, 2)
      };

      const file = await this.drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id, name, createdTime'
      });

      return file.data;
    } catch (error) {
      console.error('Error creating backup:', error);
      throw error;
    }
  }

  // Get user backups
  async getUserBackups(userId) {
    try {
      const folderId = await this.ensureFolderExists();
      
      const response = await this.drive.files.list({
        q: `'${folderId}' in parents and name contains 'backup_${userId}_'`,
        fields: 'files(id, name, createdTime, size)',
        orderBy: 'createdTime desc'
      });

      return response.data.files;
    } catch (error) {
      console.error('Error getting user backups:', error);
      throw error;
    }
  }

  // Restore from backup
  async restoreFromBackup(userId, backupId) {
    try {
      const fileData = await this.drive.files.get({
        fileId: backupId,
        alt: 'media'
      });

      // Convert response data to string if it's a buffer
      let dataString = fileData.data;
      if (Buffer.isBuffer(dataString)) {
        dataString = dataString.toString('utf8');
      } else if (typeof dataString === 'object') {
        dataString = JSON.stringify(dataString);
      }

      const backupData = JSON.parse(dataString);
      
      // Remove backup metadata
      delete backupData.backupCreatedAt;
      delete backupData.originalUserId;
      
      // Update timestamps
      backupData.lastModified = new Date().toISOString();

      // Save as current ledger data
      return await this.saveLedgerData(userId, backupData);
    } catch (error) {
      console.error('Error restoring from backup:', error);
      throw error;
    }
  }

  // Delete all user data
  async deleteUserData(userId) {
    try {
      const folderId = await this.ensureFolderExists();
      
      // Find all files belonging to the user
      const response = await this.drive.files.list({
        q: `'${folderId}' in parents and (name contains '${userId}')`,
        fields: 'files(id, name)'
      });

      // Delete each file
      const deletePromises = response.data.files.map(file => 
        this.drive.files.delete({ fileId: file.id })
      );

      await Promise.all(deletePromises);
      
      console.log(`Deleted ${response.data.files.length} files for user ${userId}`);
      return true;
    } catch (error) {
      console.error('Error deleting user data:', error);
      throw error;
    }
  }
}