const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/User');

const router = express.Router();

// 로그인 페이지
router.get('/login', (req, res) => {
  const error = req.session.error; // 오류 메시지
  const success = req.session.success; // 성공 메시지
  delete req.session.error; // 메시지 표시 후 삭제
  delete req.session.success; // 메시지 표시 후 삭제
  res.render('login', { error, success });
});

// 로그인 처리
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (user && await bcrypt.compare(password, user.password)) {
      req.session.user = { id: user._id, username: user.username }; // 세션에 사용자 정보 저장
      return res.redirect('/dashboard'); // 대시보드로 이동
    } else {
      req.session.error = '아이디 또는 비밀번호가 잘못되었습니다.';
      return res.redirect('/auth/login');
    }
  } catch (err) {
    console.error('로그인 중 오류:', err);
    req.session.error = '로그인 처리 중 문제가 발생했습니다.';
    res.redirect('/auth/login');
  }
});

// 회원가입 페이지
router.get('/signup', (req, res) => {
  const error = req.session.error; // 오류 메시지
  delete req.session.error; // 메시지 표시 후 삭제
  res.render('signup', { error });
});

// 회원가입 처리
router.post('/signup', async (req, res) => {
  const { username, password, confirmPassword } = req.body;

  try {
    // 비밀번호 확인
    if (password !== confirmPassword) {
      req.session.error = '비밀번호가 일치하지 않습니다.';
      return res.redirect('/auth/signup');
    }

    // 아이디 중복 확인
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      req.session.error = '이미 존재하는 아이디입니다.';
      return res.redirect('/auth/signup');
    }

    // 사용자 생성
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();

    // 성공 메시지 설정 후 로그인 페이지로 리다이렉트
    req.session.success = '회원가입이 성공적으로 완료되었습니다.';
    res.redirect('/auth/login');
  } catch (err) {
    console.error('회원가입 중 오류:', err);
    req.session.error = '회원가입 처리 중 문제가 발생했습니다.';
    res.redirect('/auth/signup');
  }
});

// 로그아웃
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('로그아웃 중 오류:', err);
      return res.status(500).send('로그아웃 중 문제가 발생했습니다.');
    }
    res.redirect('/auth/login'); // 로그아웃 후 로그인 페이지로 이동
  });
});

module.exports = router;