const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const dotenv = require('dotenv');
dotenv.config();
const mongoose = require('mongoose');
const User = require('./models/User');

const makeAdmin = async (email) => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      family: 4,
      serverSelectionTimeoutMS: 60000,
      connectTimeoutMS: 60000,
    });
    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ User not found with that email');
      process.exit(1);
    }
    user.role = 'admin';
    await user.save();
    console.log(`✅ ${email} is now an ADMIN`);
    process.exit(0);
  } catch (e) {
    console.error('❌', e.message);
    process.exit(1);
  }
};

// Usage: node seeder.js youremail@students.au.edu.pk
makeAdmin(process.argv[2] || '2510278@students.au.edu.pk');