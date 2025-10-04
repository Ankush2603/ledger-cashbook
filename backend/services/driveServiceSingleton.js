import { GoogleDriveService } from '../services/googleDrive.js';

// Create a singleton instance
let driveServiceInstance = null;

export async function getDriveService() {
  if (!driveServiceInstance) {
    driveServiceInstance = new GoogleDriveService();
    await driveServiceInstance.ensureInitialized();
  }
  return driveServiceInstance;
}

export function setDriveService(instance) {
  driveServiceInstance = instance;
}