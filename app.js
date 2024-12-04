const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const session = require('express-session');
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');

dotenv.config();

const app = express();

// 미들웨어 설정
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
}));

// 데이터베이스 연결
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB에 연결되었습니다.'))
  .catch((err) => console.error(err));

// 뷰 엔진 설정
app.set('view engine', 'ejs');

// 라우터 연결
app.use('/auth', authRoutes);
app.use('/dashboard', dashboardRoutes);

// 기본 경로
app.get('/', (req, res) => {
  res.redirect('/auth/login');
});

// 서버 실행
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`서버가 ${PORT}번 포트에서 실행 중입니다.`);
});