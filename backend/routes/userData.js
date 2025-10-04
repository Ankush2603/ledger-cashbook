import express from 'express';
import { body, validationResult } from 'express-validator';
import { getDriveService } from '../services/driveServiceSingleton.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Validation middleware for ledger data
const validateLedgerData = [
  body('books').isArray().withMessage('Books must be an array'),
  body('transactions').isArray().withMessage('Transactions must be an array'),
  body('selectedBookId').optional().isString().withMessage('Selected book ID must be a string')
];

// Helper function to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Get user's ledger data
router.get('/ledger', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const driveService = await getDriveService();
    const ledgerData = await driveService.getUserLedgerData(userId);

    if (!ledgerData) {
      // Return empty structure for new users
      return res.json({
        success: true,
        data: {
          books: [],
          transactions: [],
          selectedBookId: null,
          lastModified: new Date().toISOString()
        }
      });
    }

    res.json({
      success: true,
      data: ledgerData
    });

  } catch (error) {
    console.error('Get ledger data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve ledger data'
    });
  }
});

// Save/Update user's ledger data
router.post('/ledger', authenticateToken, validateLedgerData, handleValidationErrors, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { books, transactions, selectedBookId } = req.body;

    const ledgerData = {
      books,
      transactions,
      selectedBookId,
      lastModified: new Date().toISOString(),
      userId
    };

    const driveService = await getDriveService();
    const savedData = await driveService.saveLedgerData(userId, ledgerData);

    res.json({
      success: true,
      message: 'Ledger data saved successfully',
      data: savedData
    });

  } catch (error) {
    console.error('Save ledger data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save ledger data'
    });
  }
});

// Backup user data (creates a backup copy)
router.post('/backup', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const driveService = await getDriveService();
    const backupResult = await driveService.createBackup(userId);

    res.json({
      success: true,
      message: 'Backup created successfully',
      data: {
        backupId: backupResult.id,
        backupName: backupResult.name,
        createdAt: backupResult.createdTime
      }
    });

  } catch (error) {
    console.error('Backup creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create backup'
    });
  }
});

// Get list of user backups
router.get('/backups', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const driveService = await getDriveService();
    const backups = await driveService.getUserBackups(userId);

    res.json({
      success: true,
      data: {
        backups: backups.map(backup => ({
          id: backup.id,
          name: backup.name,
          createdAt: backup.createdTime,
          size: backup.size
        }))
      }
    });

  } catch (error) {
    console.error('Get backups error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve backups'
    });
  }
});

// Restore from backup
router.post('/restore/:backupId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { backupId } = req.params;

    const driveService = await getDriveService();
    const restoredData = await driveService.restoreFromBackup(userId, backupId);

    res.json({
      success: true,
      message: 'Data restored successfully from backup',
      data: restoredData
    });

  } catch (error) {
    console.error('Restore backup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to restore from backup'
    });
  }
});

// Delete user account and all data
router.delete('/account', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Confirm password for account deletion
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password confirmation required for account deletion'
      });
    }

    const driveService = await getDriveService();
    const user = await driveService.getUserById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const bcrypt = await import('bcryptjs');
    const isValidPassword = await bcrypt.default.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password'
      });
    }

    await driveService.deleteUserData(userId);

    res.json({
      success: true,
      message: 'Account and all data deleted successfully'
    });

  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete account'
    });
  }
});

export default router;