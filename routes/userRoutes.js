const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  checkUsername, getPublicProfile, followUser, unfollowUser,
  removeFollower, getFollowers, getFollowing, reportUser,
} = require('../controllers/userController');

router.get('/username/:username/available', checkUsername);

router.get('/:id/followers', getFollowers);
router.get('/:id/following', getFollowing);
router.post('/:id/follow', protect, followUser);
router.post('/:id/unfollow', protect, unfollowUser);
router.post('/:id/remove-follower', protect, removeFollower);
router.post('/:id/report', protect, reportUser);

router.get('/:id', getPublicProfile);

module.exports = router;