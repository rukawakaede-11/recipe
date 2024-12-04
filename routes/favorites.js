// routes/favorites.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Recipe = require('../models/Recipe');

// 즐겨찾기 추가
router.post('/:recipeId', async (req, res) => {
  const { recipeId } = req.params;
  try {
    // 사용자 인증이 되어 있다고 가정
    const user = await User.findById(req.user.id);
    user.favorites.push(recipeId);
    await user.save();
    res.redirect('/recipes');
  } catch (err) {
    console.error(err);
    res.redirect('/recipes');
  }
});

// 즐겨찾기 목록 조회
router.get('/', async (req, res) => {
  try {
    // 사용자 인증이 되어 있다고 가정
    const user = await User.findById(req.user.id).populate('favorites');
    res.render('favorites', { recipes: user.favorites });
  } catch (err) {
    console.error(err);
    res.redirect('/');
  }
});

// 즐겨찾기 삭제
router.post('/:recipeId/remove', async (req, res) => {
  const { recipeId } = req.params;
  try {
    const user = await User.findById(req.user.id);
    // 즐겨찾기에서 해당 레시피 제거
    user.favorites = user.favorites.filter(id => id.toString() !== recipeId);
    await user.save();
    res.redirect('/favorites'); // 즐겨찾기 페이지로 리디렉션
  } catch (err) {
    console.error(err);
    res.redirect('/favorites');
  }
});

module.exports = router;