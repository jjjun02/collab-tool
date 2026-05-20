const pool = require('../config/db');

// API-S-001 오류 로그 조회 (시스템 admin 전용)
exports.getLogs = async (req, res) => {
  // JWT의 role이 admin인지 확인 (프로젝트 admin이 아닌 시스템 전체 admin)
  if (req.user.role !== 'admin')
    return res.status(403).json({ status: 'error', code: 'FORBIDDEN', message: '시스템 관리자 권한이 없습니다.' });

  const { date, level } = req.query;

  try {
    let query = 'SELECT timestamp, level, message, stack FROM error_logs WHERE 1=1';
    const params = [];

    if (date) {
      query += ' AND DATE(timestamp) = ?';
      params.push(date);
    }
    if (level) {
      query += ' AND level = ?';
      params.push(level);
    }
    query += ' ORDER BY timestamp DESC';

    const [logs] = await pool.query(query, params);
    res.json({ status: 'success', data: { logs } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};