const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const router = express.Router();

router.get('/login', (req, res) => {
  const error = req.session.error;
  const success = req.session.success;
  delete req.session.error;
  delete req.session.success;
  res.render('login', { error, success });
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (user && await bcrypt.compare(password, user.password)) {
      req.session.user = { id: user._id, username: user.username };
      return res.redirect('/dashboard');
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

router.get('/signup', (req, res) => {
  const error = req.session.error;
  delete req.session.error;
  res.render('signup', { error });
});

router.post('/signup', async (req, res) => {
  const { username, password, confirmPassword } = req.body;

  try {
    if (password !== confirmPassword) {
      req.session.error = '비밀번호가 일치하지 않습니다.';
      return res.redirect('/auth/signup');
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      req.session.error = '이미 존재하는 아이디입니다.';
      return res.redirect('/auth/signup');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();

    req.session.success = '회원가입이 성공적으로 완료되었습니다.';
    res.redirect('/auth/login');
  } catch (err) {
    console.error('회원가입 중 오류:', err);
    req.session.error = '회원가입 처리 중 문제가 발생했습니다.';
    res.redirect('/auth/signup');
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('로그아웃 중 오류:', err);
      return res.status(500).send('로그아웃 중 문제가 발생했습니다.');
    }
    res.redirect('/auth/login');
  });
});

module.exports = router;