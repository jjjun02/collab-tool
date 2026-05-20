const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// API-U-001 회원가입
exports.register = async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name)
    return res.status(400).json({ status: 'error', code: 'INVALID_INPUT', message: '모든 항목을 입력해주세요.' });

  try {
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0)
      return res.status(409).json({ status: 'error', code: 'EMAIL_DUPLICATE', message: '이미 사용 중인 이메일입니다.' });

    const hashed = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (email, password, name) VALUES (?, ?, ?)',
      [email, hashed, name]
    );
    res.status(201).json({
      status: 'success',
      data: { message: '회원가입이 완료되었습니다.', userId: result.insertId }
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// API-U-002 로그인
exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ status: 'error', code: 'INVALID_INPUT', message: '이메일과 비밀번호를 입력해주세요.' });

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0)
      return res.status(401).json({ status: 'error', code: 'INVALID_CREDENTIALS', message: '이메일 또는 비밀번호가 틀렸습니다.' });

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(401).json({ status: 'error', code: 'INVALID_CREDENTIALS', message: '이메일 또는 비밀번호가 틀렸습니다.' });

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role }, // role 추가
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.json({
      status: 'success',
      data: {
        accessToken: token,   // token → accessToken
        userId: user.id,
        name: user.name,
        role: user.role       // role 추가
      }
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// API-U-003 로그아웃
exports.logout = (req, res) => {
  res.json({ status: 'success', data: { message: '로그아웃 되었습니다.' } });
};

// API-U-004 내 정보 조회
exports.getMe = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, email, name, role, created_at, updated_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (rows.length === 0)
      return res.status(404).json({ status: 'error', message: '사용자를 찾을 수 없습니다.' });

    const user = rows[0];
    res.json({
      status: 'success',
      data: {
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      }
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// API-U-005 내 정보 수정
exports.updateMe = async (req, res) => {
  const { name, password } = req.body;
  if (!name && !password)
    return res.status(400).json({ status: 'error', code: 'INVALID_INPUT', message: '수정할 항목을 입력해주세요.' });

  try {
    if (name) await pool.query('UPDATE users SET name = ? WHERE id = ?', [name, req.user.id]);
    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashed, req.user.id]);
    }
    const [rows] = await pool.query('SELECT updated_at FROM users WHERE id = ?', [req.user.id]);
    res.json({
      status: 'success',
      data: { message: '정보가 수정되었습니다.', updatedAt: rows[0].updated_at }
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};