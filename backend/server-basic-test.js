import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 5000;

// Basic middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'Server is running without Google Drive'
  });
});

// Basic auth endpoint
app.post('/api/auth/register', (req, res) => {
  console.log('📝 Registration request received:', req.body);
  res.json({ 
    success: true, 
    message: 'Registration test successful (no Google Drive)',
    user: {
      email: req.body.email,
      name: req.body.name
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Basic server running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
});