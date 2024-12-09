const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema({
  title: String,
  ingredients: [String],
  instructions: [String],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  recommendedCount: {
    type: Number,
    default: 0
  },
  usersRecommended: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
});

const Recipe = mongoose.model('Recipe', recipeSchema);
module.exports = Recipe;
