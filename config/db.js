// config/db.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB에 성공적으로 연결되었습니다.');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

module.exports = connectDB;