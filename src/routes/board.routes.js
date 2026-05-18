const express = require('express');
const router = express.Router({ mergeParams: true });
const auth = require('../middlewares/auth');
const {
  createPost, getPosts, getPost,
  updatePost, deletePost, createComment, deleteComment
} = require('../controllers/board.controller');

router.use(auth);

router.post('/', createPost);
router.get('/', getPosts);
router.get('/:postId', getPost);
router.put('/:postId', updatePost);
router.delete('/:postId', deletePost);
router.post('/:postId/comments', createComment);
router.delete('/:postId/comments/:commentId', deleteComment);

module.exports = router;