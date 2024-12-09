const express = require('express');
const router = express.Router();
const Recipe = require('../models/Recipe');

router.get('/', async (req, res) => {
  try {
    const recipes = await Recipe.find();
    res.render('recipes', { recipes });
  } catch (err) {
    console.error(err);
    res.redirect('/');
  }
});

router.get('/new', (req, res) => {
  res.render('new-recipe');
});

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
    const recipes = await Recipe.find({ title: new RegExp(query, 'i') });
    res.render('search-results', { recipes });
  } catch (err) {
    console.error(err);
    res.redirect('/dashboard');
  }
});

module.exports = router;