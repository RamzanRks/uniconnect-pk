const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      family: 4,                        // Force IPv4 (fixes Windows DNS bug)
      serverSelectionTimeoutMS: 60000,  // Wait up to 60s to find the server
      connectTimeoutMS: 60000,          // Wait up to 60s for the socket
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;