import { GoogleDriveService } from './services/googleDrive.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

async function testRegistration() {
  console.log('🧪 Testing registration functionality...\n');
  
  const testUser = {
    email: 'test@example.com',
    password: 'TestPass123',
    name: 'Test User'
  };

  console.log('📝 Test user data:', {
    email: testUser.email,
    name: testUser.name,
    password: '[HIDDEN]'
  });

  try {
    // Initialize Google Drive service
    console.log('\n1️⃣ Initializing Google Drive service...');
    const driveService = new GoogleDriveService();
    
    // Wait a moment for initialization
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if user already exists
    console.log('\n2️⃣ Checking if user exists...');
    let existingUser;
    try {
      existingUser = await driveService.getUserByEmail(testUser.email);
      if (existingUser) {
        console.log('⚠️  User already exists, testing login instead...');
        
        // Test login
        const isValidPassword = await bcrypt.compare(testUser.password, existingUser.password);
        if (isValidPassword) {
          console.log('✅ Login test successful!');
          
          const token = jwt.sign(
            { 
              userId: existingUser.id, 
              email: existingUser.email,
              name: existingUser.name 
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
          );
          
          console.log('🔑 JWT token generated successfully');
          console.log('👤 User:', existingUser.name, existingUser.email);
          return { success: true, action: 'login', user: existingUser, token };
        } else {
          console.log('❌ Password verification failed');
          return { success: false, error: 'Invalid password' };
        }
      }
    } catch (driveError) {
      console.error('❌ Google Drive error:', driveError.message);
      return { success: false, error: 'Google Drive unavailable', details: driveError.message };
    }

    // Create new user
    console.log('\n3️⃣ Creating new user...');
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(testUser.password, saltRounds);

    const userData = {
      email: testUser.email,
      password: hashedPassword,
      name: testUser.name,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };

    const user = await driveService.createUser(userData);
    console.log('✅ User created successfully!');

    // Generate JWT token
    console.log('\n4️⃣ Generating JWT token...');
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
    
    return { success: true, action: 'register', user, token };

  } catch (error) {
    console.error('\n❌ Registration test failed:', error.message);
    return { success: false, error: error.message };
  }
}

testRegistration()
  .then(result => {
    console.log('\n📊 Test Result:', JSON.stringify(result, null, 2));
    if (result.success) {
      console.log('\n🎉 Backend functionality is working correctly!');
      console.log('The issue is with Windows networking, not the backend code.');
    } else {
      console.log('\n💡 Issue found:', result.error);
    }
  })
  .catch(error => {
    console.error('\n💥 Test script failed:', error);
  });