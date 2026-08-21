const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const dotenv = require('dotenv');
dotenv.config();
const mongoose = require('mongoose');
const User = require('./models/User');

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI, {
    family: 4,
    serverSelectionTimeoutMS: 60000,
    connectTimeoutMS: 60000,
  });
  const res = await User.updateMany(
    { 'nameChangeRequest.firstName': { $exists: false } },
    { $unset: { nameChangeRequest: 1 } }
  );
  console.log('✅ Cleaned polluted documents:', res.modifiedCount);
  process.exit(0);
};
run();