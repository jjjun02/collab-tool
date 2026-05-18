const pool = require('../config/db');
const crypto = require('crypto');

// API-P-001 프로젝트 생성
exports.createProject = async (req, res) => {
  const { name, description } = req.body;
  if (!name)
    return res.status(400).json({ status: 'error', code: 'INVALID_INPUT', message: '프로젝트 이름은 필수입니다.' });

  try {
    const inviteCode = crypto.randomBytes(6).toString('hex');
    const [result] = await pool.query(
      'INSERT INTO projects (name, description, owner_id, invite_code) VALUES (?, ?, ?, ?)',
      [name, description || null, req.user.id, inviteCode]
    );
    const projectId = result.insertId;
    await pool.query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)',
      [projectId, req.user.id, 'admin']
    );
    const [project] = await pool.query('SELECT created_at FROM projects WHERE id = ?', [projectId]);
    res.status(201).json({
      status: 'success',
      data: { projectId, name, inviteCode, createdAt: project[0].created_at }
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// API-P-002 프로젝트 목록 조회
exports.getMyProjects = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.id AS projectId, p.name, p.description, pm.role AS myRole, p.created_at AS createdAt
       FROM projects p
       JOIN project_members pm ON p.id = pm.project_id
       WHERE pm.user_id = ?
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    res.json({ status: 'success', data: { projects: rows } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// API-P-003 프로젝트 상세 조회
exports.getProject = async (req, res) => {
  const { projectId } = req.params;
  try {
    const [memberRows] = await pool.query(
      'SELECT role FROM project_members WHERE project_id = ? AND user_id = ?',
      [projectId, req.user.id]
    );
    if (memberRows.length === 0)
      return res.status(403).json({ status: 'error', code: 'FORBIDDEN', message: '접근 권한이 없습니다.' });

    const [projects] = await pool.query('SELECT * FROM projects WHERE id = ?', [projectId]);
    if (projects.length === 0)
      return res.status(404).json({ status: 'error', code: 'PROJECT_NOT_FOUND', message: '프로젝트를 찾을 수 없습니다.' });

    const [members] = await pool.query(
      `SELECT u.id AS userId, u.name, pm.role
       FROM project_members pm
       JOIN users u ON pm.user_id = u.id
       WHERE pm.project_id = ?`,
      [projectId]
    );

    const project = projects[0];
    const isAdmin = memberRows[0].role === 'admin';

    res.json({
      status: 'success',
      data: {
        projectId: project.id,
        name: project.name,
        description: project.description,
        inviteCode: isAdmin ? project.invite_code : null, // admin만 초대코드 노출
        members,
        createdAt: project.created_at,
        updatedAt: project.updated_at
      }
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// API-P-004 프로젝트 수정
exports.updateProject = async (req, res) => {
  const { projectId } = req.params;
  const { name, description } = req.body;
  try {
    const [member] = await pool.query(
      'SELECT role FROM project_members WHERE project_id = ? AND user_id = ?',
      [projectId, req.user.id]
    );
    if (member.length === 0 || member[0].role !== 'admin')
      return res.status(403).json({ status: 'error', code: 'FORBIDDEN', message: '관리자만 수정할 수 있습니다.' });

    const [existing] = await pool.query('SELECT id FROM projects WHERE id = ?', [projectId]);
    if (existing.length === 0)
      return res.status(404).json({ status: 'error', code: 'PROJECT_NOT_FOUND', message: '프로젝트를 찾을 수 없습니다.' });

    await pool.query(
      'UPDATE projects SET name = ?, description = ? WHERE id = ?',
      [name, description, projectId]
    );
    const [updated] = await pool.query('SELECT updated_at FROM projects WHERE id = ?', [projectId]);
    res.json({
      status: 'success',
      data: { message: '프로젝트가 수정되었습니다.', updatedAt: updated[0].updated_at }
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// API-P-005 프로젝트 삭제
exports.deleteProject = async (req, res) => {
  const { projectId } = req.params;
  try {
    const [member] = await pool.query(
      'SELECT role FROM project_members WHERE project_id = ? AND user_id = ?',
      [projectId, req.user.id]
    );
    if (member.length === 0 || member[0].role !== 'admin')
      return res.status(403).json({ status: 'error', code: 'FORBIDDEN', message: '관리자만 삭제할 수 있습니다.' });

    const [existing] = await pool.query('SELECT id FROM projects WHERE id = ?', [projectId]);
    if (existing.length === 0)
      return res.status(404).json({ status: 'error', code: 'PROJECT_NOT_FOUND', message: '프로젝트를 찾을 수 없습니다.' });

    await pool.query('DELETE FROM projects WHERE id = ?', [projectId]);
    res.json({ status: 'success', data: { message: '프로젝트가 삭제되었습니다.' } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// API-P-006 초대코드 갱신
exports.refreshInviteCode = async (req, res) => {
  const { projectId } = req.params;
  try {
    const [member] = await pool.query(
      'SELECT role FROM project_members WHERE project_id = ? AND user_id = ?',
      [projectId, req.user.id]
    );
    if (member.length === 0 || member[0].role !== 'admin')
      return res.status(403).json({ status: 'error', code: 'FORBIDDEN', message: '관리자만 초대코드를 갱신할 수 있습니다.' });

    const [existing] = await pool.query('SELECT id FROM projects WHERE id = ?', [projectId]);
    if (existing.length === 0)
      return res.status(404).json({ status: 'error', code: 'PROJECT_NOT_FOUND', message: '프로젝트를 찾을 수 없습니다.' });

    const newCode = crypto.randomBytes(6).toString('hex');
    await pool.query('UPDATE projects SET invite_code = ? WHERE id = ?', [newCode, projectId]);
    res.json({ status: 'success', data: { inviteCode: newCode } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// API-P-007 초대코드로 참여
exports.joinProject = async (req, res) => {
  const { inviteCode } = req.body;
  if (!inviteCode)
    return res.status(400).json({ status: 'error', code: 'INVALID_INVITE_CODE', message: '초대코드를 입력해주세요.' });

  try {
    const [projects] = await pool.query('SELECT * FROM projects WHERE invite_code = ?', [inviteCode]);
    if (projects.length === 0)
      return res.status(404).json({ status: 'error', code: 'PROJECT_NOT_FOUND', message: '유효하지 않은 초대코드입니다.' });

    const project = projects[0];
    const [existing] = await pool.query(
      'SELECT id FROM project_members WHERE project_id = ? AND user_id = ?',
      [project.id, req.user.id]
    );
    if (existing.length > 0)
      return res.status(409).json({ status: 'error', code: 'ALREADY_MEMBER', message: '이미 참여 중인 프로젝트입니다.' });

    await pool.query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)',
      [project.id, req.user.id, 'member']
    );
    res.status(201).json({   // 200 → 201
      status: 'success',
      data: { message: '프로젝트에 참여했습니다.', projectId: project.id, projectName: project.name }
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// API-P-008 팀원 목록 조회
exports.getMembers = async (req, res) => {
  const { projectId } = req.params;
  try {
    const [memberCheck] = await pool.query(
      'SELECT id FROM project_members WHERE project_id = ? AND user_id = ?',
      [projectId, req.user.id]
    );
    if (memberCheck.length === 0)
      return res.status(403).json({ status: 'error', code: 'FORBIDDEN', message: '접근 권한이 없습니다.' });

    const [existing] = await pool.query('SELECT id FROM projects WHERE id = ?', [projectId]);
    if (existing.length === 0)
      return res.status(404).json({ status: 'error', code: 'PROJECT_NOT_FOUND', message: '프로젝트를 찾을 수 없습니다.' });

    const [members] = await pool.query(
      `SELECT u.id AS userId, u.name, pm.role, pm.joined_at AS joinedAt
       FROM project_members pm
       JOIN users u ON pm.user_id = u.id
       WHERE pm.project_id = ?`,
      [projectId]
    );
    res.json({ status: 'success', data: { members } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};