console.log('🧪 Testing basic Node.js...');

try {
  console.log('✅ Console works');
  
  import('express').then(() => {
    console.log('✅ Express import works');
  }).catch(err => {
    console.log('❌ Express import failed:', err.message);
  });
  
  console.log('✅ Basic test complete');
} catch (error) {
  console.log('❌ Basic test failed:', error.message);
}