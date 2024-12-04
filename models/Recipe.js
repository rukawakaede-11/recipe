const mongoose = require('mongoose');

const RecipeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  ingredients: { type: [String], required: true }, // 배열로 필수값 설정
  instructions: { type: [String], required: true }, // 배열로 필수값 설정
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // 필수로 로그인한 사용자 ID
});

module.exports = mongoose.model('Recipe', RecipeSchema);
