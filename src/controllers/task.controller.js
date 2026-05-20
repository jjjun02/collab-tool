const pool = require('../config/db');

const isMember = async (projectId, userId) => {
  const [rows] = await pool.query(
    'SELECT role FROM project_members WHERE project_id = ? AND user_id = ?',
    [projectId, userId]
  );
  return rows.length > 0 ? rows[0] : null;
};

// API-T-001 Task 생성
exports.createTask = async (req, res) => {
  const { projectId } = req.params;
  const { title, description, assigneeId, dueDate } = req.body;
  if (!title)
    return res.status(400).json({ status: 'error', code: 'INVALID_INPUT', message: 'title은 필수입니다.' });

  try {
    const member = await isMember(projectId, req.user.id);
    if (!member) return res.status(403).json({ status: 'error', code: 'FORBIDDEN', message: '접근 권한이 없습니다.' });

    const [existing] = await pool.query('SELECT id FROM projects WHERE id = ?', [projectId]);
    if (existing.length === 0)
      return res.status(404).json({ status: 'error', code: 'PROJECT_NOT_FOUND', message: '프로젝트를 찾을 수 없습니다.' });

    const [result] = await pool.query(
      'INSERT INTO tasks (project_id, title, description, assignee_id, due_date, created_by) VALUES (?, ?, ?, ?, ?, ?)',
      [projectId, title, description || null, assigneeId || null, dueDate || null, req.user.id]
    );
    const taskId = result.insertId;
    const [task] = await pool.query('SELECT created_at FROM tasks WHERE id = ?', [taskId]);

    res.status(201).json({
      status: 'success',
      data: {
        taskId,
        title,
        status: 'todo',
        createdBy: { userId: req.user.id, name: req.user.name },
        createdAt: task[0].created_at
      }
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// API-T-002 Task 목록 조회
exports.getTasks = async (req, res) => {
  const { projectId } = req.params;
  const { status, assigneeId } = req.query;

  try {
    const member = await isMember(projectId, req.user.id);
    if (!member) return res.status(403).json({ status: 'error', code: 'FORBIDDEN', message: '접근 권한이 없습니다.' });

    let query = `SELECT t.id AS taskId, t.title, t.status,
                   t.assignee_id, u.name AS assigneeName,
                   t.due_date AS dueDate, t.updated_at AS updatedAt
                 FROM tasks t
                 LEFT JOIN users u ON t.assignee_id = u.id
                 WHERE t.project_id = ?`;
    const params = [projectId];

    if (status) { query += ' AND t.status = ?'; params.push(status); }
    if (assigneeId) { query += ' AND t.assignee_id = ?'; params.push(assigneeId); }

    const [rows] = await pool.query(query, params);

    const now = new Date();
    const tasks = rows.map(t => ({
      taskId: t.taskId,
      title: t.title,
      status: t.status,
      assignee: t.assignee_id ? { userId: t.assignee_id, name: t.assigneeName } : null,
      dueDate: t.dueDate,
      updatedAt: t.updatedAt,
      isOverdue: t.dueDate && t.status !== 'done' ? new Date(t.dueDate) < now : false
    }));

    res.json({ status: 'success', data: { tasks } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// API-T-003 Task 상세 조회
exports.getTask = async (req, res) => {
  const { projectId, taskId } = req.params;
  try {
    const member = await isMember(projectId, req.user.id);
    if (!member) return res.status(403).json({ status: 'error', code: 'FORBIDDEN', message: '접근 권한이 없습니다.' });

    const [rows] = await pool.query(
      `SELECT t.id AS taskId, t.title, t.description, t.status,
              t.assignee_id, ua.name AS assigneeName,
              t.due_date AS dueDate,
              t.created_by, uc.name AS createdByName,
              t.created_at AS createdAt, t.updated_at AS updatedAt
       FROM tasks t
       LEFT JOIN users ua ON t.assignee_id = ua.id
       LEFT JOIN users uc ON t.created_by = uc.id
       WHERE t.id = ? AND t.project_id = ?`,
      [taskId, projectId]
    );
    if (rows.length === 0)
      return res.status(404).json({ status: 'error', code: 'TASK_NOT_FOUND', message: 'Task를 찾을 수 없습니다.' });

    const t = rows[0];
    const now = new Date();
    res.json({
      status: 'success',
      data: {
        taskId: t.taskId,
        title: t.title,
        description: t.description,
        status: t.status,
        assignee: t.assignee_id ? { userId: t.assignee_id, name: t.assigneeName } : null,
        dueDate: t.dueDate,
        isOverdue: t.dueDate && t.status !== 'done' ? new Date(t.dueDate) < now : false,
        createdBy: { userId: t.created_by, name: t.createdByName },
        createdAt: t.createdAt,
        updatedAt: t.updatedAt
      }
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// API-T-004 Task 수정
exports.updateTask = async (req, res) => {
  const { projectId, taskId } = req.params;
  const { title, description, assigneeId, dueDate } = req.body;
  try {
    const member = await isMember(projectId, req.user.id);
    if (!member) return res.status(403).json({ status: 'error', code: 'FORBIDDEN', message: '접근 권한이 없습니다.' });

    const [existing] = await pool.query(
      'SELECT id FROM tasks WHERE id = ? AND project_id = ?', [taskId, projectId]
    );
    if (existing.length === 0)
      return res.status(404).json({ status: 'error', code: 'TASK_NOT_FOUND', message: 'Task를 찾을 수 없습니다.' });

    await pool.query(
      'UPDATE tasks SET title = ?, description = ?, assignee_id = ?, due_date = ? WHERE id = ?',
      [title, description, assigneeId || null, dueDate || null, taskId]
    );
    const [updated] = await pool.query('SELECT updated_at FROM tasks WHERE id = ?', [taskId]);
    res.json({
      status: 'success',
      data: { message: 'Task가 수정되었습니다.', updatedAt: updated[0].updated_at }
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// API-T-005 Task 상태 변경
exports.updateTaskStatus = async (req, res) => {
  const { projectId, taskId } = req.params;
  const { status } = req.body;
  const validStatus = ['todo', 'doing', 'done'];
  if (!validStatus.includes(status))
    return res.status(400).json({ status: 'error', code: 'INVALID_STATUS', message: 'status는 todo/doing/done 중 하나여야 합니다.' });

  try {
    const member = await isMember(projectId, req.user.id);
    if (!member) return res.status(403).json({ status: 'error', code: 'FORBIDDEN', message: '접근 권한이 없습니다.' });

    const [existing] = await pool.query(
      'SELECT id FROM tasks WHERE id = ? AND project_id = ?', [taskId, projectId]
    );
    if (existing.length === 0)
      return res.status(404).json({ status: 'error', code: 'TASK_NOT_FOUND', message: 'Task를 찾을 수 없습니다.' });

    await pool.query('UPDATE tasks SET status = ? WHERE id = ?', [status, taskId]);
    const [updated] = await pool.query('SELECT updated_at FROM tasks WHERE id = ?', [taskId]);
    res.json({
      status: 'success',
      data: { taskId: parseInt(taskId), status, updatedAt: updated[0].updated_at }
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// API-T-006 Task 삭제
exports.deleteTask = async (req, res) => {
  const { projectId, taskId } = req.params;
  try {
    const member = await isMember(projectId, req.user.id);
    if (!member) return res.status(403).json({ status: 'error', code: 'FORBIDDEN', message: '접근 권한이 없습니다.' });

    const [tasks] = await pool.query(
      'SELECT created_by FROM tasks WHERE id = ? AND project_id = ?', [taskId, projectId]
    );
    if (tasks.length === 0)
      return res.status(404).json({ status: 'error', code: 'TASK_NOT_FOUND', message: 'Task를 찾을 수 없습니다.' });

    // 작성자 또는 admin만 삭제 가능
    if (tasks[0].created_by !== req.user.id && member.role !== 'admin')
      return res.status(403).json({ status: 'error', code: 'FORBIDDEN', message: '작성자 또는 관리자만 삭제할 수 있습니다.' });

    await pool.query('DELETE FROM tasks WHERE id = ?', [taskId]);
    res.json({ status: 'success', data: { message: 'Task가 삭제되었습니다.' } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};