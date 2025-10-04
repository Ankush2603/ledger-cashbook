import { GoogleDriveService } from './services/googleDrive.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

async function testLogin() {
  console.log('🧪 Testing login functionality...\n');
  
  const loginData = {
    email: 'test@example.com',
    password: 'TestPass123'
  };

  console.log('📝 Login attempt for:', loginData.email);

  try {
    // Initialize Google Drive service
    console.log('\n1️⃣ Initializing Google Drive service...');
    const driveService = new GoogleDriveService();
    
    // Wait a moment for initialization
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Find user
    console.log('\n2️⃣ Finding user...');
    const user = await driveService.getUserByEmail(loginData.email);
    if (!user) {
      console.log('❌ User not found');
      return { success: false, error: 'User not found' };
    }

    console.log('✅ User found:', user.name, user.email);

    // Check password
    console.log('\n3️⃣ Verifying password...');
    const isValidPassword = await bcrypt.compare(loginData.password, user.password);
    if (!isValidPassword) {
      console.log('❌ Invalid password');
      return { success: false, error: 'Invalid password' };
    }

    console.log('✅ Password verified successfully');

    // Update last login (optional, won't fail if it doesn't work)
    console.log('\n4️⃣ Updating last login...');
    try {
      await driveService.updateUserLastLogin(user.id);
      console.log('✅ Last login updated');
    } catch (updateError) {
      console.warn('⚠️  Failed to update last login:', updateError.message);
    }

    // Generate JWT token
    console.log('\n5️⃣ Generating JWT token...');
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        name: user.name 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    console.log('🔑 JWT token generated successfully');
    console.log('👤 User:', user.name, user.email);
    console.log('🆔 User ID:', user.id);
    
    return { success: true, user, token };

  } catch (error) {
    console.error('\n❌ Login test failed:', error.message);
    return { success: false, error: error.message };
  }
}

testLogin()
  .then(result => {
    console.log('\n📊 Test Result:', JSON.stringify(result, null, 2));
    if (result.success) {
      console.log('\n🎉 Login functionality is working correctly!');
    } else {
      console.log('\n💡 Issue found:', result.error);
    }
  })
  .catch(error => {
    console.error('\n💥 Test script failed:', error);
  });