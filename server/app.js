const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const logger = require('./utils/logger');
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.get('/', (req, res) => {
  logger.info('누군가 메인 페이지에 접속.');
  res.send('서버가 정상적으로 작동 중입니다.');
});

app.get('/error-test', (req, res, next) => {
  const err = new Error('테스트 오류.');
  next(err);
});

app.use((err, req, res, next) => {
  logger.error(`${err.message} - ${req.originalUrl}`);
  res.status(500).json({ message: '서버에 오류가 발생했습니다.' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});