import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import router from './router';

// import authRoutes from './routes/auth.routes.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Routes
// app.use('/api/auth', authRoutes);
app.use('/api', router);
// Health check
app.get('/', (_req, res) => {
  res.send('🚀 AI HR Platform API is running...');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`⚡ Server started on port ${PORT}`);
});
