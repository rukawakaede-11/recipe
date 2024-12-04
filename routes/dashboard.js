const express = require('express');
const Recipe = require('../models/Recipe');
const User = require('../models/User');
const router = express.Router();

// 대시보드: 즐겨찾기 및 내가 작성한 레시피 표시
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

// 새 레시피 작성 페이지
router.get('/create', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }

  res.render('create-recipe'); // 새 레시피 작성 페이지를 렌더링
});

router.post('/create', async (req, res) => {
  // 폼 데이터 받기
  const { title, ingredients, instructions } = req.body;
  
  // 폼 데이터 검증 (빈 값이 없는지 확인)
  if (!title || !ingredients || !instructions || instructions.length === 0) {
    console.error("필수 입력 항목이 비어 있습니다.");
    return res.status(400).send("모든 필드를 채워주세요.");
  }

  try {
    // 새로운 레시피 생성
    const newRecipe = new Recipe({
      title,
      ingredients: ingredients.split(','), // 쉼표로 구분된 재료 처리
      instructions,
      createdBy: req.session.user.id, // 사용자 ID (로그인한 사용자)
    });

    // 레시피 저장
    await newRecipe.save();
    res.redirect('/dashboard'); // 대시보드로 리다이렉트

  } catch (err) {
    console.error("레시피 작성 중 오류:", err);
    res.status(500).send("레시피 작성 중 오류가 발생했습니다.");
  }
});

// 레시피 상세 페이지
router.get('/recipe/:id', async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/auth/login'); // 로그인하지 않으면 로그인 페이지로 리디렉션
  }

  try {
    const recipe = await Recipe.findById(req.params.id)
      .populate('createdBy'); // createdBy 필드를 전체 객체로 가져옴
    res.render('recipe-detail', { recipe, user: req.session.user });
  } catch (err) {
    console.error('레시피 로드 중 오류:', err);
    res.status(404).send('레시피를 찾을 수 없습니다.');
  }
});


// 레시피 수정 페이지
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

// 레시피 수정 처리
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

// 레시피 삭제
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

// 즐겨찾기에서 레시피 삭제
router.post('/recipe/:id/favorite/remove', async (req, res) => {
  if (!req.session.user) return res.redirect('/auth/login');
  const { id } = req.params;
  try {
    const user = await User.findById(req.session.user.id);
    user.favorites = user.favorites.filter(favId => favId.toString() !== id);
    await user.save();
    res.redirect('/dashboard'); // 대시보드로 리디렉션
  } catch (err) {
    console.error(err);
    res.status(500).send('즐겨찾기 삭제 중 오류가 발생했습니다.');
  }
});

// 즐겨찾기 추가 처리
router.post('/recipe/:id/favorite', async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/auth/login'); // 로그인하지 않은 경우 로그인 페이지로 리디렉션
  }

  try {
    const user = await User.findById(req.session.user.id);
    const recipe = await Recipe.findById(req.params.id);

    if (!user.favorites.includes(recipe._id)) {
      // 즐겨찾기 목록에 해당 레시피가 없다면 추가
      user.favorites.push(recipe._id);
      await user.save();
    }

    // 대시보드로 리디렉션
    res.redirect('/dashboard');
  } catch (err) {
    console.error('즐겨찾기 추가 중 오류:', err);
    res.status(500).send('즐겨찾기 추가 중 오류가 발생했습니다.');
  }
});

// 검색 결과 페이지
router.get('/search-results', async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/auth/login'); // 로그인하지 않으면 로그인 페이지로 리디렉션
  }

  const { query, type } = req.query; // 검색어와 검색 유형

  try {
    let searchResults = [];
    if (type === 'name') {
      // 음식 이름으로 검색
      searchResults = await Recipe.find({
        title: { $regex: query, $options: 'i' } // 제목에 검색어가 포함된 레시피 찾기
      });
    } else if (type === 'ingredient') {
      // 재료로 검색
      searchResults = await Recipe.find({
        ingredients: { $regex: query, $options: 'i' } // 재료 목록에서 검색어가 포함된 레시피 찾기
      });
    }

    // 검색 결과를 렌더링
    res.render('search-results', { searchResults, username: req.session.user.username });
  } catch (err) {
    console.error('검색 중 오류:', err);
    res.status(500).send('검색 중 오류가 발생했습니다.');
  }
});

module.exports = router;