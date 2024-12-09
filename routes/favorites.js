const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Recipe = require('../models/Recipe');

router.post('/:recipeId', async (req, res) => {
  const { recipeId } = req.params;
  try {
    const user = await User.findById(req.user.id);
    user.favorites.push(recipeId);
    await user.save();
    res.redirect('/recipes');
  } catch (err) {
    console.error(err);
    res.redirect('/recipes');
  }
});

router.get('/', async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('favorites');
    res.render('favorites', { recipes: user.favorites });
  } catch (err) {
    console.error(err);
    res.redirect('/');
  }
});

router.post('/:recipeId/remove', async (req, res) => {
  const { recipeId } = req.params;
  try {
    const user = await User.findById(req.user.id);
    user.favorites = user.favorites.filter(id => id.toString() !== recipeId);
    await user.save();
    res.redirect('/favorites');
  } catch (err) {
    console.error(err);
    res.redirect('/favorites');
  }
});

module.exports = router;