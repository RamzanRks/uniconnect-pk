const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const dotenv = require('dotenv');
dotenv.config();
const mongoose = require('mongoose');
const ProjectPost = require('./models/ProjectPost');
const Application = require('./models/Application');

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI, { family: 4, serverSelectionTimeoutMS: 60000, connectTimeoutMS: 60000 });
  const projects = await ProjectPost.find();
  for (const p of projects) {
    const accepted = await Application.find({ project: p._id, status: 'accepted' }).select('applicant');
    await ProjectPost.updateOne({ _id: p._id }, { team: accepted.map((a) => a.applicant) });
  }
  console.log('✅ Teams backfilled for', projects.length, 'projects');
  process.exit(0);
};
run();