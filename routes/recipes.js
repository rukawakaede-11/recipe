// routes/recipes.js
const express = require('express');
const router = express.Router();
const Recipe = require('../models/Recipe');

// 모든 레시피 조회
router.get('/', async (req, res) => {
  try {
    const recipes = await Recipe.find();
    res.render('recipes', { recipes });
  } catch (err) {
    console.error(err);
    res.redirect('/');
  }
});

// 레시피 생성 폼
router.get('/new', (req, res) => {
  res.render('new-recipe');
});

// 레시피 생성 처리
router.post('/', async (req, res) => {
  const { title, ingredients, instructions } = req.body;
  try {
    const newRecipe = new Recipe({
      title,
      ingredients: ingredients.split(','),
      instructions,
    });
    await newRecipe.save();
    res.redirect('/recipes');
  } catch (err) {
    console.error(err);
    res.redirect('/recipes/new');
  }
});

router.get('/search', async (req, res) => {
  const { query } = req.query;
  try {
    // 제목에 검색어가 포함된 레시피 찾기
    const recipes = await Recipe.find({ title: new RegExp(query, 'i') });
    res.render('search-results', { recipes });
  } catch (err) {
    console.error(err);
    res.redirect('/dashboard');
  }
});

module.exports = router;