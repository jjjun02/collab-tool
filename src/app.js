const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const projectRoutes = require('./routes/project.routes');
const taskRoutes = require('./routes/task.routes');
const boardRoutes = require('./routes/board.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/v1', authRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/projects/:projectId/tasks', taskRoutes);
app.use('/api/v1/projects/:projectId/posts', boardRoutes);
app.use('/api/v1/admin', adminRoutes);

app.get('/', (req, res) => {
  res.json({ status: 'success', message: 'Server running!' });
});

const pool = require('./config/db');
const PORT = process.env.PORT || 4000;

pool.getConnection()
  .then(conn => {
    conn.release();
    console.log('DB connected!');
    app.listen(PORT, () => {
      console.log(`Server running: http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('DB connection failed:', err.message);
  });   