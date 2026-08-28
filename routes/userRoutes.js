const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  checkUsername, getPublicProfile, followUser, unfollowUser,
  removeFollower, getFollowers, getFollowing, reportUser,
  getActivity, getMyProfileViews, toggleTopic, getPopularTopics, getPresence, getExplore,blockUser,unblockUser,
} = require('../controllers/userController');

router.get('/username/:username/available', checkUsername);
router.get('/topics/popular', getPopularTopics);
router.post('/topics/:tag/toggle', protect, toggleTopic);
router.get('/presence', protect, getPresence);
router.get('/explore', protect, getExplore);
router.post('/:id/block', protect, blockUser);
router.post('/:id/unblock', protect, unblockUser);
router.get('/me/views', protect, getMyProfileViews);

router.get('/:id/followers', getFollowers);
router.get('/:id/following', getFollowing);
router.post('/:id/follow', protect, followUser);
router.post('/:id/unfollow', protect, unfollowUser);
router.post('/:id/remove-follower', protect, removeFollower);
router.post('/:id/report', protect, reportUser);
router.get('/:id/activity', getActivity);

router.get('/:id', protect, getPublicProfile);

module.exports = router;