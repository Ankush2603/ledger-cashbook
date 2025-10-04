import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  console.log('Health check requested');
  res.json({ status: 'OK', message: 'Test server running' });
});

app.post('/test-register', (req, res) => {
  console.log('Registration test:', req.body);
  res.json({ success: true, message: 'Test registration received', data: req.body });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🧪 Test server running on http://localhost:${PORT}`);
  console.log('Try: http://localhost:5000/health');
});