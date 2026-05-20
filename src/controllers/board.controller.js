const pool = require('../config/db');

const isMember = async (projectId, userId) => {
  const [rows] = await pool.query(
    'SELECT role FROM project_members WHERE project_id = ? AND user_id = ?',
    [projectId, userId]
  );
  return rows.length > 0 ? rows[0] : null;
};

// API-B-001 게시글 작성
exports.createPost = async (req, res) => {
  const { projectId } = req.params;
  const { title, content } = req.body;
  if (!title || !content)
    return res.status(400).json({ status: 'error', code: 'INVALID_INPUT', message: 'title과 content는 필수입니다.' });

  try {
    const member = await isMember(projectId, req.user.id);
    if (!member) return res.status(403).json({ status: 'error', code: 'FORBIDDEN', message: '접근 권한이 없습니다.' });

    const [result] = await pool.query(
      'INSERT INTO posts (project_id, author_id, title, content) VALUES (?, ?, ?, ?)',
      [projectId, req.user.id, title, content]
    );
    const postId = result.insertId;
    const [post] = await pool.query('SELECT created_at FROM posts WHERE id = ?', [postId]);

    res.status(201).json({
      status: 'success',
      data: {
        postId,
        title,
        author: { userId: req.user.id, name: req.user.name },
        createdAt: post[0].created_at
      }
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// API-B-002 게시글 목록 조회
exports.getPosts = async (req, res) => {
  const { projectId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const size = parseInt(req.query.size) || 10;  // limit → size
  const offset = (page - 1) * size;

  try {
    const member = await isMember(projectId, req.user.id);
    if (!member) return res.status(403).json({ status: 'error', code: 'FORBIDDEN', message: '접근 권한이 없습니다.' });

    const [rows] = await pool.query(
      `SELECT p.id AS postId, p.title,
              p.author_id AS userId, u.name,
              p.created_at AS createdAt, p.updated_at AS updatedAt
       FROM posts p JOIN users u ON p.author_id = u.id
       WHERE p.project_id = ?
       ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
      [projectId, size, offset]
    );
    const [[{ total }]] = await pool.query(
      'SELECT COUNT(*) as total FROM posts WHERE project_id = ?', [projectId]
    );

    const posts = rows.map(p => ({
      postId: p.postId,
      title: p.title,
      author: { userId: p.userId, name: p.name },
      createdAt: p.createdAt,
      updatedAt: p.updatedAt
    }));

    res.json({
      status: 'success',
      data: {
        posts,
        totalCount: total,
        totalPages: Math.ceil(total / size),
        currentPage: page
      }
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// API-B-003 게시글 상세 조회
exports.getPost = async (req, res) => {
  const { projectId, postId } = req.params;
  try {
    const member = await isMember(projectId, req.user.id);
    if (!member) return res.status(403).json({ status: 'error', code: 'FORBIDDEN', message: '접근 권한이 없습니다.' });

    const [posts] = await pool.query(
      `SELECT p.id AS postId, p.title, p.content,
              p.author_id AS userId, u.name,
              p.created_at AS createdAt, p.updated_at AS updatedAt
       FROM posts p JOIN users u ON p.author_id = u.id
       WHERE p.id = ? AND p.project_id = ?`,
      [postId, projectId]
    );
    if (posts.length === 0)
      return res.status(404).json({ status: 'error', code: 'POST_NOT_FOUND', message: '게시글을 찾을 수 없습니다.' });

    const [comments] = await pool.query(
      `SELECT c.id AS commentId, c.content,
              c.author_id AS userId, u.name,
              c.created_at AS createdAt
       FROM comments c JOIN users u ON c.author_id = u.id
       WHERE c.post_id = ? ORDER BY c.created_at ASC`,
      [postId]
    );

    const p = posts[0];
    res.json({
      status: 'success',
      data: {
        postId: p.postId,
        title: p.title,
        content: p.content,
        author: { userId: p.userId, name: p.name },
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        comments: comments.map(c => ({
          commentId: c.commentId,
          content: c.content,
          author: { userId: c.userId, name: c.name },
          createdAt: c.createdAt
        }))
      }
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// API-B-004 게시글 수정
exports.updatePost = async (req, res) => {
  const { projectId, postId } = req.params;
  const { title, content } = req.body;
  try {
    const member = await isMember(projectId, req.user.id);
    if (!member) return res.status(403).json({ status: 'error', code: 'FORBIDDEN', message: '접근 권한이 없습니다.' });

    const [posts] = await pool.query(
      'SELECT author_id FROM posts WHERE id = ? AND project_id = ?', [postId, projectId]
    );
    if (posts.length === 0)
      return res.status(404).json({ status: 'error', code: 'POST_NOT_FOUND', message: '게시글을 찾을 수 없습니다.' });
    if (posts[0].author_id !== req.user.id)
      return res.status(403).json({ status: 'error', code: 'FORBIDDEN', message: '작성자만 수정할 수 있습니다.' });

    await pool.query(
      'UPDATE posts SET title = ?, content = ? WHERE id = ?', [title, content, postId]
    );
    const [updated] = await pool.query('SELECT updated_at FROM posts WHERE id = ?', [postId]);
    res.json({
      status: 'success',
      data: { message: '게시글이 수정되었습니다.', updatedAt: updated[0].updated_at }
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// API-B-005 게시글 삭제
exports.deletePost = async (req, res) => {
  const { projectId, postId } = req.params;
  try {
    const member = await isMember(projectId, req.user.id);
    if (!member) return res.status(403).json({ status: 'error', code: 'FORBIDDEN', message: '접근 권한이 없습니다.' });

    const [posts] = await pool.query(
      'SELECT author_id FROM posts WHERE id = ? AND project_id = ?', [postId, projectId]
    );
    if (posts.length === 0)
      return res.status(404).json({ status: 'error', code: 'POST_NOT_FOUND', message: '게시글을 찾을 수 없습니다.' });
    if (posts[0].author_id !== req.user.id && member.role !== 'admin')
      return res.status(403).json({ status: 'error', code: 'FORBIDDEN', message: '권한이 없습니다.' });

    await pool.query('DELETE FROM posts WHERE id = ?', [postId]);
    res.json({ status: 'success', data: { message: '게시글이 삭제되었습니다.' } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// API-B-006 댓글 작성
exports.createComment = async (req, res) => {
  const { projectId, postId } = req.params;
  const { content } = req.body;
  if (!content)
    return res.status(400).json({ status: 'error', code: 'INVALID_INPUT', message: 'content는 필수입니다.' });

  try {
    const member = await isMember(projectId, req.user.id);
    if (!member) return res.status(403).json({ status: 'error', code: 'FORBIDDEN', message: '접근 권한이 없습니다.' });

    const [postCheck] = await pool.query('SELECT id FROM posts WHERE id = ? AND project_id = ?', [postId, projectId]);
    if (postCheck.length === 0)
      return res.status(404).json({ status: 'error', code: 'POST_NOT_FOUND', message: '게시글을 찾을 수 없습니다.' });

    const [result] = await pool.query(
      'INSERT INTO comments (post_id, author_id, content) VALUES (?, ?, ?)',
      [postId, req.user.id, content]
    );
    const commentId = result.insertId;
    const [comment] = await pool.query('SELECT created_at FROM comments WHERE id = ?', [commentId]);

    res.status(201).json({
      status: 'success',
      data: {
        commentId,
        content,
        author: { userId: req.user.id, name: req.user.name },
        createdAt: comment[0].created_at
      }
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// API-B-007 댓글 삭제
exports.deleteComment = async (req, res) => {
  const { projectId, commentId } = req.params;
  try {
    const member = await isMember(projectId, req.user.id);
    if (!member) return res.status(403).json({ status: 'error', code: 'FORBIDDEN', message: '접근 권한이 없습니다.' });

    const [comments] = await pool.query('SELECT author_id FROM comments WHERE id = ?', [commentId]);
    if (comments.length === 0)
      return res.status(404).json({ status: 'error', code: 'COMMENT_NOT_FOUND', message: '댓글을 찾을 수 없습니다.' });
    if (comments[0].author_id !== req.user.id && member.role !== 'admin')
      return res.status(403).json({ status: 'error', code: 'FORBIDDEN', message: '권한이 없습니다.' });

    await pool.query('DELETE FROM comments WHERE id = ?', [commentId]);
    res.json({ status: 'success', data: { message: '댓글이 삭제되었습니다.' } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};