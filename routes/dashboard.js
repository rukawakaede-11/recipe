const express = require('express');
const Recipe = require('../models/Recipe');
const User = require('../models/User');
const Comment = require('../models/Comment');
const router = express.Router();

router.get('/', async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }

  try {
    const user = await User.findById(req.session.user.id).populate('favorites');
    const myRecipes = await Recipe.find({ createdBy: req.session.user.id });
    res.render('dashboard', { username: req.session.user.username, favorites: user.favorites, myRecipes });
  } catch (err) {
    console.error('대시보드 로드 중 오류:', err);
    res.status(500).send('대시보드 로드 중 오류가 발생했습니다.');
  }
});

router.get('/create', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }

  res.render('create-recipe');
});

router.post('/create', async (req, res) => {
  const { title, ingredients, instructions } = req.body;
  
  if (!title || !ingredients || !instructions || instructions.length === 0) {
    console.error("필수 입력 항목이 비어 있습니다.");
    return res.status(400).send("모든 필드를 채워주세요.");
  }

  try {
    const newRecipe = new Recipe({
      title,
      ingredients: ingredients.split(','),
      instructions,
      createdBy: req.session.user.id,
    });

    await newRecipe.save();
    res.redirect('/dashboard');

  } catch (err) {
    console.error("레시피 작성 중 오류:", err);
    res.status(500).send("레시피 작성 중 오류가 발생했습니다.");
  }
});

router.get('/recipe/:id', async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }

  try {
    const recipe = await Recipe.findById(req.params.id).populate('createdBy');
    const comments = await Comment.find({ recipe: req.params.id }).populate('createdBy', 'username');

    res.render('recipe-detail', { recipe, user: req.session.user, comments });
  } catch (err) {
    console.error('레시피 로드 중 오류:', err);
    res.status(404).send('레시피를 찾을 수 없습니다.');
  }
});

router.post('/recipe/:id/comment', async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }

  const { content } = req.body;
  const recipeId = req.params.id;

  try {
    const comment = new Comment({
      content,
      createdBy: req.session.user.id,
      recipe: recipeId
    });

    await comment.save();
    res.redirect(`/dashboard/recipe/${recipeId}`);
  } catch (err) {
    console.error('댓글 작성 중 오류:', err);
    res.status(500).send('댓글 작성 중 오류가 발생했습니다.');
  }
});

router.post('/recipe/:id/comment/:commentId/delete', async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }

  const { commentId } = req.params;
  const { id } = req.params;

  try {
    const comment = await Comment.findById(commentId);

    if (comment.createdBy.toString() !== req.session.user.id) {
      return res.status(403).send('권한이 없습니다.');
    }

    await Comment.findByIdAndDelete(commentId);

    res.redirect(`/dashboard/recipe/${id}`);
  } catch (err) {
    console.error('댓글 삭제 중 오류:', err);
    res.status(500).send('댓글 삭제 중 오류가 발생했습니다.');
  }
});

router.get('/recipe/:id/edit', async (req, res) => {
  if (!req.session.user) return res.redirect('/auth/login');
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (recipe.createdBy.toString() !== req.session.user.id) {
      return res.status(403).send('권한이 없습니다.');
    }
    res.render('edit-recipe', { recipe });
  } catch (err) {
    console.error(err);
    res.status(500).send('오류가 발생했습니다.');
  }
});

router.post('/recipe/:id/edit', async (req, res) => {
  if (!req.session.user) return res.redirect('/auth/login');
  const { title, ingredients, instructions } = req.body;
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (recipe.createdBy.toString() !== req.session.user.id) {
      return res.status(403).send('권한이 없습니다.');
    }
    recipe.title = title;
    recipe.ingredients = ingredients.split(',');
    recipe.instructions = instructions;
    await recipe.save();
    res.redirect(`/dashboard/recipe/${req.params.id}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('오류가 발생했습니다.');
  }
});

router.get('/recipe/:id/delete', async (req, res) => {
  if (!req.session.user) return res.redirect('/auth/login');
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (recipe.createdBy.toString() !== req.session.user.id) {
      return res.status(403).send('권한이 없습니다.');
    }
    await Recipe.findByIdAndDelete(req.params.id);
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    res.status(500).send('오류가 발생했습니다.');
  }
});

router.post('/recipe/:id/favorite/remove', async (req, res) => {
  if (!req.session.user) return res.redirect('/auth/login');
  const { id } = req.params;
  try {
    const user = await User.findById(req.session.user.id);
    user.favorites = user.favorites.filter(favId => favId.toString() !== id);
    await user.save();
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    res.status(500).send('즐겨찾기 삭제 중 오류가 발생했습니다.');
  }
});

router.post('/recipe/:id/favorite', async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }

  try {
    const user = await User.findById(req.session.user.id);
    const recipe = await Recipe.findById(req.params.id);

    if (!user.favorites.includes(recipe._id)) {
      user.favorites.push(recipe._id);
      await user.save();
    }

    res.redirect('/dashboard');
  } catch (err) {
    console.error('즐겨찾기 추가 중 오류:', err);
    res.status(500).send('즐겨찾기 추가 중 오류가 발생했습니다.');
  }
});

router.get('/search-results', async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }

  const { query, type } = req.query;

  try {
    let searchResults = [];
    if (type === 'name') {
      searchResults = await Recipe.find({
        title: { $regex: query, $options: 'i' }
      });
    } else if (type === 'ingredient') {
      searchResults = await Recipe.find({
        ingredients: { $regex: query, $options: 'i' }
      });
    }

    res.render('search-results', { searchResults, username: req.session.user.username });
  } catch (err) {
    console.error('검색 중 오류:', err);
    res.status(500).send('검색 중 오류가 발생했습니다.');
  }
});

router.post('/recipe/:id/recommend', async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }

  try {
    const recipe = await Recipe.findById(req.params.id);

    if (recipe.usersRecommended.includes(req.session.user.id)) {
      return res.send('<script>alert("이미 추천했습니다."); window.history.back();</script>');
    }

    recipe.usersRecommended.push(req.session.user.id);
    recipe.recommendedCount += 1;
    await recipe.save();

    res.redirect(`/dashboard/recipe/${req.params.id}`);
  } catch (err) {
    console.error('추천 처리 중 오류:', err);
    res.status(500).send('추천 처리 중 오류가 발생했습니다.');
  }
});

module.exports = router;