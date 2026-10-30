'use strict';

const LS_KEY = 'kaoyan11408.v1';
const ACCENTS = ['#4f46e5', '#0ea5e9', '#10b981', '#ef4444', '#f59e0b', '#ec4899', '#8b5cf6', '#64748b'];
const CS408_CHAPTERS = [
  ['数据结构', '绪论'], ['数据结构', '线性表'], ['数据结构', '栈和队列'], ['数据结构', '串'],
  ['数据结构', '树与二叉树'], ['数据结构', '图'], ['数据结构', '查找'], ['数据结构', '排序'],
  ['组成原理', '计算机系统概述'], ['组成原理', '数据的表示和运算'], ['组成原理', '存储系统'], ['组成原理', '指令系统'],
  ['组成原理', '中央处理器'], ['组成原理', '总线'], ['组成原理', '输入输出系统'],
  ['操作系统', '操作系统概述'], ['操作系统', '进程管理'], ['操作系统', '内存管理'], ['操作系统', '文件管理'], ['操作系统', '输入输出管理'],
  ['计算机网络', '计算机网络体系结构'], ['计算机网络', '物理层'], ['计算机网络', '数据链路层'], ['计算机网络', '网络层'], ['计算机网络', '传输层'], ['计算机网络', '应用层']
];
const QUOTES = [
  '路虽远，行则将至；事虽难，做则必成。',
  '千里之行，始于足下。',
  '不积跬步，无以至千里。',
  '宝剑锋从磨砺出，梅花香自苦寒来。',
  '有志者，事竟成。',
  '天道酬勤。',
  '星光不问赶路人，时光不负有心人。',
  '每一份努力，都不会被辜负。',
  '成功的路上并不拥挤，因为坚持的人不多。',
  '今天多学一点，明天就少一点遗憾。',
  '耐得住寂寞，才能守得住繁华。',
  '没有横空出世的运气，只有不为人知的努力。',
  '你只管努力，剩下的交给时间。',
  '山再高，往上攀，总能登顶；路再长，走下去，定能到达。',
  '熬过无人问津的日子，才有诗和远方。',
  '所有的惊艳，都来自长久的准备。'
];

function defaultData() {
  return {
    settings: { examDate: '2027-12-25', theme: 'light', accent: '#4f46e5', nickname: '' },
    subjects: [
      { id: 'politics', name: '政治', color: '#ef4444', target: 75, modules: ['马原', '毛中特', '史纲', '思修法基', '时政'], chapters: [] },
      { id: 'english', name: '英语一', color: '#3b82f6', target: 70, modules: ['词汇', '语法长难句', '阅读', '完形翻译', '写作'], chapters: [] },
      { id: 'math', name: '数学一', color: '#10b981', target: 110, modules: ['高数', '线代', '概率论'], chapters: [] },
      { id: 'cs408', name: '408', color: '#8b5cf6', target: 110, modules: ['数据结构', '组成原理', '操作系统', '计算机网络'], chapters: CS408_CHAPTERS.map((c, i) => ({ id: 'c408-' + i, module: c[0], title: c[1], round: 0 })) }
    ],
    todos: [],
    sessions: [],
    wrong: [],
    checkins: [],
    stages: [
      { id: 'base', name: '基础阶段', start: '2026-10-01', end: '2027-06-30' },
      { id: 'boost', name: '强化阶段', start: '2027-07-01', end: '2027-10-31' },
      { id: 'sprint', name: '冲刺阶段', start: '2027-11-01', end: '2027-12-25' }
    ],
    goal: { school: '', major: '', targetTotal: null, line: null, note: '' }
  };
}

function normalize(d) {
  const def = defaultData();
  for (const k of Object.keys(def)) if (!(k in d)) d[k] = def[k];
  if (!Array.isArray(d.subjects)) d.subjects = def.subjects;
  if (!Array.isArray(d.todos)) d.todos = [];
  if (!Array.isArray(d.sessions)) d.sessions = [];
  if (!Array.isArray(d.wrong)) d.wrong = [];
  if (!Array.isArray(d.checkins)) d.checkins = [];
  if (!Array.isArray(d.stages)) d.stages = def.stages;
  d.subjects.forEach(s => { if (!Array.isArray(s.chapters)) s.chapters = []; });
  d.settings = Object.assign({}, def.settings, d.settings || {});
  d.goal = Object.assign({ school: '', major: '', targetTotal: null, line: null, note: '' }, d.goal || {});
  return d;
}

let data = load();
const timer = { running: false, subjectId: null, acc: 0, startedAt: 0, interval: null };
let wrongFilter = 'all';
let editingSubjectId = null;
let editingSubjectColor = ACCENTS[0];
let currentWrongPhoto = null;
let progressSubjectId = null;
let editingStageId = null;
let quoteOffset = 0;

function load() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return normalize(JSON.parse(raw));
  } catch (e) { /* ignore */ }
  return defaultData();
}
function save() { localStorage.setItem(LS_KEY, JSON.stringify(data)); }

function $(id) { return document.getElementById(id); }
function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function dateStr(d) {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), dd = String(d.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + dd;
}
function todayStr() { return dateStr(new Date()); }
function parseDate(s) { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); }
function fmtMin(min) {
  min = Math.round(min);
  if (min < 60) return min + ' 分钟';
  const h = Math.floor(min / 60), mm = min % 60;
  return mm ? h + ' 小时 ' + mm + ' 分' : h + ' 小时';
}
function fmtClock(secs) {
  const h = String(Math.floor(secs / 3600)).padStart(2, '0');
  const m = String(Math.floor((secs % 3600) / 60)).padStart(2, '0');
  const s = String(secs % 60).padStart(2, '0');
  return h + ':' + m + ':' + s;
}
function hexToRgba(hex, a) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
}
function subjectById(id) { return data.subjects.find(s => s.id === id); }

function applyTheme() {
  document.documentElement.dataset.theme = data.settings.theme;
  document.documentElement.style.setProperty('--accent', data.settings.accent);
  document.documentElement.style.setProperty('--accent-soft', hexToRgba(data.settings.accent, data.settings.theme === 'dark' ? 0.24 : 0.12));
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', data.settings.accent);
}

function showToast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => { t.hidden = true; }, 1800);
}

function openModal(id) { $(id).hidden = false; }
function closeModal(id) { $(id).hidden = true; }

// ---------- navigation ----------
function switchView(v) {
  document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(el => el.classList.toggle('active', el.dataset.view === v));
  $('view-' + v).classList.add('active');
  if (v === 'timer') { renderTimer(); if (timer.running) startTicking(); }
  else { stopTicking(); render(v); }
}
function render(v) {
  if (v === 'home') renderHome();
  else if (v === 'plan') renderPlan();
  else if (v === 'timer') renderTimer();
  else if (v === 'progress') renderProgress();
  else if (v === 'wrong') renderWrong();
}

// ---------- home ----------
function daysLeft() {
  const exam = parseDate(data.settings.examDate);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return Math.ceil((exam - today) / 86400000);
}
function minutesOn(date, subjectId) {
  return data.sessions.filter(s => s.date === date && (!subjectId || s.subjectId === subjectId))
    .reduce((sum, s) => sum + s.minutes, 0);
}
function activeDateSet() {
  const set = new Set(data.checkins);
  data.sessions.forEach(s => set.add(s.date));
  data.todos.forEach(t => { if (t.done) set.add(t.date); });
  return set;
}
function streak() {
  const set = activeDateSet();
  let n = 0, d = new Date();
  if (!set.has(dateStr(d))) d.setDate(d.getDate() - 1);
  while (set.has(dateStr(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

function currentStage() {
  const today = todayStr();
  for (const st of data.stages) {
    if (today >= st.start && today <= st.end) return st;
  }
  if (data.stages.length && today < data.stages[0].start) return data.stages[0];
  return data.stages[data.stages.length - 1] || null;
}
function stageProgress(st) {
  const start = parseDate(st.start), end = parseDate(st.end);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const total = Math.max(1, Math.round((end - start) / 86400000) + 1);
  let elapsed = Math.round((today - start) / 86400000) + 1;
  elapsed = Math.max(0, Math.min(total, elapsed));
  return { elapsed, total, pct: Math.round(elapsed / total * 100) };
}
function isStageActive(st) {
  const today = todayStr();
  return today >= st.start && today <= st.end;
}

function greeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 11) return '早上好';
  if (h >= 11 && h < 13) return '中午好';
  if (h >= 13 && h < 18) return '下午好';
  if (h >= 18 && h < 23) return '晚上好';
  return '夜深了';
}
function dayNumber() {
  const d = new Date();
  return Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000);
}
function currentQuote() {
  const idx = ((dayNumber() + quoteOffset) % QUOTES.length + QUOTES.length) % QUOTES.length;
  return QUOTES[idx];
}
function nextQuote() { quoteOffset++; renderHome(); }

function renderHome() {
  const v = $('view-home');
  const today = todayStr();
  const goal = data.goal || {};
  const todosToday = data.todos.filter(t => t.date === today);
  const doneToday = todosToday.filter(t => t.done).length;
  const studyToday = minutesOn(today);
  const strk = streak();
  const d = daysLeft();
  const stage = currentStage();
  const sp = stage ? stageProgress(stage) : null;

  const todayBars = data.subjects.map(s => ({ s, min: minutesOn(today, s.id) })).filter(x => x.min > 0);
  const maxMin = Math.max(1, ...todayBars.map(x => x.min));
  const barList = data.subjects.map(x => {
    const min = minutesOn(today, x.id);
    const pct = maxMin ? Math.round(min / maxMin * 100) : 0;
    return `<div class="bar-row">
      <span><span class="dot" style="background:${x.color}"></span> ${escapeHtml(x.name)}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${min ? Math.max(8, pct) : 0}%;background:${x.color}"></div></div>
      <span>${min ? fmtMin(min) : '—'}</span>
    </div>`;
  }).join('');

  const days = [];
  for (let i = 6; i >= 0; i--) {
    const dd = new Date(); dd.setDate(dd.getDate() - i);
    days.push({ date: dateStr(dd), label: '日一二三四五六'[dd.getDay()], isToday: i === 0, min: minutesOn(dateStr(dd)) });
  }
  const weekMax = Math.max(1, ...days.map(x => x.min));
  const weekHtml = days.map(x => `<div class="week-col">
      <div class="week-bar ${x.isToday ? 'active' : ''}" style="height:${Math.max(2, Math.round(x.min / weekMax * 84))}px" title="${x.min}分钟"></div>
      <span class="week-label">${x.label}</span>
    </div>`).join('');

  v.innerHTML = `
    <div class="welcome card" onclick="nextQuote()">
      <div class="welcome-hi">${greeting()}，${escapeHtml(data.settings.nickname || '同学')} 👋</div>
      <div class="welcome-quote">“${escapeHtml(currentQuote())}” <span class="quote-refresh">↻ 换一句</span></div>
    </div>
    <div class="countdown">
      <div><span class="days">${d > 0 ? d : '—'}</span><span class="unit">天</span></div>
      <div class="sub">距离初试 · ${escapeHtml(data.settings.examDate)}</div>
      <div class="date-edit" onclick="openModal('modalSettings')">✏️ 修改考试日期</div>
      ${stage ? `<div class="sub" style="margin-top:10px;display:flex;justify-content:space-between"><span>📅 ${escapeHtml(stage.name)}</span><span>第 ${sp.elapsed}/${sp.total} 天</span></div>
      <div class="bar-track" style="margin-top:6px;background:rgba(255,255,255,.25)"><div class="bar-fill" style="width:${sp.pct}%;background:#fff"></div></div>` : ''}
    </div>

    <div class="card" onclick="openGoalModal()" style="cursor:pointer">
      <h2 style="display:flex;justify-content:space-between;align-items:center">🎯 目标院校 <span style="color:var(--muted);font-size:12px;font-weight:400">编辑 ›</span></h2>
      ${goal.school ? `
        <div style="font-size:17px;font-weight:700">${escapeHtml(goal.school)}${goal.major ? ' · ' + escapeHtml(goal.major) : ''}</div>
        <div class="todo-meta" style="margin-top:8px;flex-wrap:wrap">
          ${goal.targetTotal ? `<span class="mini-tag">目标总分 ${goal.targetTotal}</span>` : ''}
          ${goal.line ? `<span class="mini-tag">复试线 ${goal.line}</span>` : ''}
          ${goal.note ? `<span class="mini-tag">${escapeHtml(goal.note)}</span>` : ''}
        </div>` : '<div class="empty">还没设置目标院校，点这里填写</div>'}
    </div>

    <div class="grid2">
      <div class="stat"><b>${doneToday}/${todosToday.length}</b><span>今日待办</span></div>
      <div class="stat"><b>${fmtMin(studyToday)}</b><span>今日学习</span></div>
      <div class="stat"><b>${strk} 天</b><span>连续打卡</span></div>
      <div class="stat" style="display:flex;align-items:center;justify-content:center">
        <button class="btn primary" style="width:auto;padding:8px 16px" onclick="checkIn()">打卡</button>
      </div>
    </div>

    <div class="card">
      <h2>今日各科学习</h2>
      ${todayBars.length ? `<div class="bar-list">${barList}</div>` : '<div class="empty">今天还没有学习记录，去计时页开始吧</div>'}
    </div>

    <div class="card">
      <h2>最近 7 天</h2>
      <div class="week-chart">${weekHtml}</div>
    </div>`;
}

function checkIn() {
  const today = todayStr();
  if (!data.checkins.includes(today)) { data.checkins.push(today); save(); }
  showToast('今日已打卡 ✅');
  renderHome();
}

// ---------- plan ----------
function renderPlan() {
  const v = $('view-plan');
  const today = todayStr();
  const todos = data.todos.filter(t => t.date === today);
  const list = todos.length ? todos.map(t => {
    const s = subjectById(t.subjectId);
    return `<div class="todo-item">
      <button class="todo-check ${t.done ? 'done' : ''}" onclick="toggleTodo('${t.id}')">${t.done ? '✓' : ''}</button>
      <div class="todo-main">
        <div class="todo-text ${t.done ? 'done' : ''}">${escapeHtml(t.text)}</div>
        <div class="todo-meta">
          ${s ? `<span class="subject-tag"><span class="dot" style="background:${s.color}"></span>${escapeHtml(s.name)}</span>` : ''}
          <span>${t.minutes} 分钟</span>
        </div>
      </div>
      <button class="todo-del" onclick="deleteTodo('${t.id}')">✕</button>
    </div>`;
  }).join('') : '<div class="empty">今天还没有计划，点右上角加一条吧</div>';

  v.innerHTML = `
    <div class="card">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
        <h2 style="margin:0">今日待办</h2>
        <button class="btn ghost" style="width:auto;padding:8px 14px" onclick="openTodoModal()">+ 添加</button>
      </div>
      ${list}
    </div>`;
}

function openTodoModal() {
  fillSubjectSelect('todoSubject');
  $('todoText').value = '';
  $('todoMinutes').value = 30;
  openModal('modalTodo');
  setTimeout(() => $('todoText').focus(), 120);
}
function saveTodo() {
  const text = $('todoText').value.trim();
  if (!text) { showToast('请输入任务内容'); return; }
  data.todos.unshift({
    id: uid(), text, subjectId: $('todoSubject').value,
    minutes: Math.max(1, Number($('todoMinutes').value) || 30),
    done: false, date: todayStr(), createdAt: Date.now()
  });
  save(); closeModal('modalTodo'); renderPlan(); showToast('已添加');
}
function toggleTodo(id) {
  const t = data.todos.find(x => x.id === id);
  if (!t) return;
  t.done = !t.done;
  if (t.done) { const today = todayStr(); if (!data.checkins.includes(today)) { data.checkins.push(today); } }
  save(); renderPlan();
}
function deleteTodo(id) {
  data.todos = data.todos.filter(x => x.id !== id);
  save(); renderPlan();
}

// ---------- timer ----------
function elapsedMs() { return timer.acc + (timer.running ? Date.now() - timer.startedAt : 0); }
function renderTimer() {
  const v = $('view-timer');
  if (!timer.subjectId || !subjectById(timer.subjectId)) timer.subjectId = data.subjects[0] ? data.subjects[0].id : null;
  const chips = data.subjects.map(s => `<button class="chip ${s.id === timer.subjectId ? 'on' : ''}" onclick="setTimerSubject('${s.id}')">${escapeHtml(s.name)}</button>`).join('');
  const today = todayStr();
  const summary = data.subjects.map(s => {
    const min = minutesOn(today, s.id);
    return `<div class="bar-row">
      <span><span class="dot" style="background:${s.color}"></span> ${escapeHtml(s.name)}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${min ? '100%' : '0'};background:${s.color}"></div></div>
      <span>${fmtMin(min)}</span>
    </div>`;
  }).join('');
  const subj = subjectById(timer.subjectId);
  v.innerHTML = `
    <div class="card">
      <h2>选择科目</h2>
      <div class="chip-row">${chips}</div>
    </div>
    <div class="card">
      <div class="timer-display">
        <div class="subject-name">${subj ? escapeHtml(subj.name) : '未选择科目'}</div>
        <div class="time" id="timerTime">${fmtClock(Math.floor(elapsedMs() / 1000))}</div>
      </div>
      <div class="timer-actions">
        <button class="btn primary" id="btnTimerToggle" onclick="toggleTimer()">${timer.running ? '暂停' : '开始'}</button>
        <button class="btn danger" id="btnTimerStop" onclick="stopTimer()" ${(elapsedMs() === 0) ? 'disabled style="opacity:.5"' : ''}>结束</button>
      </div>
      <input type="text" id="timerNote" style="margin-top:14px;width:100%;padding:11px 12px;border-radius:10px;border:1px solid var(--line);background:var(--card);font-size:15px" placeholder="备注：今天学了什么（可选）" value="${escapeHtml(timer.note || '')}" onchange="timer.note=this.value" />
    </div>
    <div class="card">
      <h2>今日各科时长</h2>
      <div class="bar-list">${summary}</div>
    </div>`;
}
function setTimerSubject(id) { timer.subjectId = id; renderTimer(); }
function toggleTimer() {
  if (timer.running) {
    timer.acc += Date.now() - timer.startedAt;
    timer.running = false; stopTicking();
  } else {
    timer.startedAt = Date.now(); timer.running = true; startTicking();
  }
  renderTimer();
}
function startTicking() {
  stopTicking();
  timer.interval = setInterval(() => {
    const el = $('timerTime');
    if (el) el.textContent = fmtClock(Math.floor(elapsedMs() / 1000));
  }, 250);
}
function stopTicking() { if (timer.interval) { clearInterval(timer.interval); timer.interval = null; } }
function stopTimer() {
  const ms = elapsedMs();
  if (ms < 1000) return;
  const minutes = Math.max(1, Math.round(ms / 60000));
  const today = todayStr();
  data.sessions.push({ id: uid(), subjectId: timer.subjectId, minutes, note: timer.note || '', date: today, at: Date.now() });
  if (!data.checkins.includes(today)) data.checkins.push(today);
  save();
  timer.running = false; timer.acc = 0; timer.startedAt = 0; timer.note = '';
  stopTicking();
  showToast('已记录 ' + fmtMin(minutes));
  renderTimer();
}

// ---------- wrong ----------
function renderWrong() {
  const v = $('view-wrong');
  const chips = `<button class="chip ${wrongFilter === 'all' ? 'on' : ''}" onclick="setWrongFilter('all')">全部</button>` +
    data.subjects.map(s => `<button class="chip ${wrongFilter === s.id ? 'on' : ''}" onclick="setWrongFilter('${s.id}')">${escapeHtml(s.name)}</button>`).join('');
  const list = data.wrong.filter(w => wrongFilter === 'all' || w.subjectId === wrongFilter);
  const html = list.length ? list.map(w => {
    const s = subjectById(w.subjectId);
    return `<div class="wrong-item">
      <div class="wrong-q ${w.mastered ? 'mastered' : ''}">${escapeHtml(w.text)}</div>
      <div class="wrong-meta">
        ${s ? `<span class="subject-tag"><span class="dot" style="background:${s.color}"></span>${escapeHtml(s.name)}</span>` : ''}
        ${w.module ? `<span class="mini-tag">${escapeHtml(w.module)}</span>` : ''}
        ${w.reason ? `<span class="mini-tag">${escapeHtml(w.reason)}</span>` : ''}
      </div>
      ${w.photo ? `<img class="wrong-photo-thumb" src="${w.photo}" alt="错题照片" onclick="viewPhoto('${w.id}')" />` : ''}
      <div class="wrong-ops">
        <button class="link-btn" onclick="toggleWrong('${w.id}')">${w.mastered ? '恢复' : '标为已掌握'}</button>
        <button class="link-btn danger" onclick="deleteWrong('${w.id}')">删除</button>
      </div>
    </div>`;
  }).join('') : '<div class="empty">暂无错题，点右上角记一道</div>';
  v.innerHTML = `
    <div class="card">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
        <h2 style="margin:0">错题本</h2>
        <button class="btn ghost" style="width:auto;padding:8px 14px" onclick="openWrongModal()">+ 记错题</button>
      </div>
      <div class="chip-row" style="margin-bottom:8px">${chips}</div>
      ${html}
    </div>`;
}
function setWrongFilter(id) { wrongFilter = id; renderWrong(); }
function openWrongModal() {
  fillSubjectSelect('wrongSubject');
  $('wrongText').value = '';
  $('wrongReason').value = '知识点没记住';
  fillModuleSelect($('wrongSubject').value);
  currentWrongPhoto = null;
  updateWrongPhotoUI();
  openModal('modalWrong');
  setTimeout(() => $('wrongText').focus(), 120);
}
function saveWrong() {
  const text = $('wrongText').value.trim();
  if (!text) { showToast('请输入题目或知识点'); return; }
  data.wrong.unshift({
    id: uid(), text, subjectId: $('wrongSubject').value, module: $('wrongModule').value,
    reason: $('wrongReason').value, mastered: false, photo: currentWrongPhoto, createdAt: Date.now()
  });
  save(); closeModal('modalWrong'); renderWrong(); showToast('已记录');
}
function toggleWrong(id) { const w = data.wrong.find(x => x.id === id); if (w) { w.mastered = !w.mastered; save(); renderWrong(); } }
function deleteWrong(id) { data.wrong = data.wrong.filter(x => x.id !== id); save(); renderWrong(); }
function viewPhoto(id) {
  const w = data.wrong.find(x => x.id === id);
  if (!w || !w.photo) return;
  $('lightboxImg').src = w.photo;
  $('lightbox').hidden = false;
}
function closeLightbox() { $('lightbox').hidden = true; }
function onPhotoFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    compressImage(reader.result, 1000, 0.72).then(dataUrl => {
      currentWrongPhoto = dataUrl;
      updateWrongPhotoUI();
    });
  };
  reader.readAsDataURL(file);
}
function compressImage(src, maxW, quality) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      let w = img.width, h = img.height;
      if (w > maxW) { h = Math.round(h * maxW / w); w = maxW; }
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(src);
    img.src = src;
  });
}
function updateWrongPhotoUI() {
  const preview = $('wrongPhotoPreview');
  const clear = $('btnClearPhoto');
  if (currentWrongPhoto) {
    preview.src = currentWrongPhoto; preview.hidden = false; clear.hidden = false;
  } else {
    preview.removeAttribute('src'); preview.hidden = true; clear.hidden = true;
  }
}

// ---------- stages & progress ----------
function renderProgress() {
  const v = $('view-progress');
  if (!progressSubjectId || !subjectById(progressSubjectId)) progressSubjectId = data.subjects[0] ? data.subjects[0].id : null;
  const stageHtml = data.stages.map(st => {
    const sp = stageProgress(st);
    return `<div class="stage-row ${isStageActive(st) ? 'on' : ''}" onclick="openStageEdit('${st.id}')">
      <span class="name">${escapeHtml(st.name)}</span>
      <span class="dates">${st.start} ~ ${st.end}</span>
      <span class="pct">${sp.pct}%</span>
    </div>`;
  }).join('');
  const subjChips = data.subjects.map(s => `<button class="chip ${s.id === progressSubjectId ? 'on' : ''}" onclick="setProgressSubject('${s.id}')">${escapeHtml(s.name)}</button>`).join('');
  const subj = subjectById(progressSubjectId);
  const chapters = subj ? (subj.chapters || []) : [];
  const moduleNames = subj ? subj.modules : [];
  const groups = moduleNames.map(m => ({ module: m, items: chapters.filter(c => c.module === m) })).filter(g => g.items.length);
  const known = new Set(moduleNames);
  const orphan = chapters.filter(c => !known.has(c.module));
  if (orphan.length) groups.push({ module: '其他', items: orphan });
  const total = chapters.length;
  const r1 = chapters.filter(c => c.round >= 1).length;
  const r2 = chapters.filter(c => c.round >= 2).length;
  const r3 = chapters.filter(c => c.round >= 3).length;
  const body = groups.length ? groups.map(g => {
    const done = g.items.filter(c => c.round >= 1).length;
    const pct = g.items.length ? Math.round(done / g.items.length * 100) : 0;
    const rows = g.items.map(c => {
      const dots = [1, 2, 3].map(n => `<button class="round-dot ${c.round >= n ? 'on' : ''}" onclick="setChapterRound('${c.id}',${n})">${n}</button>`).join('');
      return `<div class="chapter-row"><span class="chapter-title">${escapeHtml(c.title)}</span><span class="rounds">${dots}</span></div>`;
    }).join('');
    return `<div class="module-block">
      <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px">
        <b>${escapeHtml(g.module)}</b><span style="color:var(--muted)">${done}/${g.items.length} 一轮</span>
      </div>
      <div class="bar-track" style="margin-bottom:10px"><div class="bar-fill" style="width:${pct}%;background:${subj ? subj.color : 'var(--accent)'}"></div></div>
      ${rows}
    </div>`;
  }).join('') : '<div class="empty">这个科目还没有章节。去「设置 → 科目管理」编辑该科目，在“章节”里按「模块：章节名」添加。</div>';
  v.innerHTML = `
    <div class="card">
      <h2>阶段性计划</h2>
      <div class="stage-list">${stageHtml}</div>
      <p class="hint" style="margin:8px 0 0">点阶段可改名称和日期；当前阶段会高亮。</p>
    </div>
    <div class="card">
      <h2>选择科目</h2>
      <div class="chip-row">${subjChips}</div>
    </div>
    <div class="card">
      <h2 style="display:flex;justify-content:space-between;align-items:center">
        <span>${escapeHtml(subj ? subj.name : '')} 章节进度</span>
        <span style="color:var(--muted);font-size:12px;font-weight:400">一轮 ${r1} · 二轮 ${r2} · 三轮 ${r3}</span>
      </h2>
      <div class="legend">数字 1/2/3 对应 基础/强化/冲刺 三轮，点亮表示该轮已过完，点一下切换。</div>
      ${body}
    </div>`;
}
function setProgressSubject(id) { progressSubjectId = id; renderProgress(); }
function setChapterRound(id, n) {
  for (const s of data.subjects) {
    const c = (s.chapters || []).find(x => x.id === id);
    if (c) { c.round = (c.round === n) ? n - 1 : n; save(); renderProgress(); return; }
  }
}
function openStageEdit(id) {
  editingStageId = id;
  const st = data.stages.find(x => x.id === id) || { name: '', start: todayStr(), end: todayStr() };
  $('stageModalTitle').textContent = id ? '编辑阶段' : '新增阶段';
  $('stageId').value = id || '';
  $('stageName').value = st.name || '';
  $('stageStart').value = st.start || todayStr();
  $('stageEnd').value = st.end || todayStr();
  $('btnDeleteStage').style.display = id ? '' : 'none';
  openModal('modalStage');
}
function saveStage() {
  const name = $('stageName').value.trim();
  if (!name) { showToast('请输入阶段名称'); return; }
  const id = $('stageId').value || 'st' + uid();
  const start = $('stageStart').value || todayStr();
  const end = $('stageEnd').value || start;
  const idx = data.stages.findIndex(x => x.id === id);
  if (idx >= 0) data.stages[idx] = { ...data.stages[idx], name, start, end };
  else data.stages.push({ id, name, start, end });
  data.stages.sort((a, b) => a.start < b.start ? -1 : 1);
  save(); closeModal('modalStage'); renderStageList(); renderHome(); renderProgress(); showToast('已保存');
}
function deleteStage() {
  const id = $('stageId').value;
  if (!id) return;
  if (!confirm('删除该阶段？')) return;
  data.stages = data.stages.filter(x => x.id !== id);
  save(); closeModal('modalStage'); renderStageList(); renderProgress();
  showToast('已删除');
}
function renderStageList() {
  $('stageList').innerHTML = data.stages.map(st => `
    <div class="stage-row ${isStageActive(st) ? 'on' : ''}" onclick="openStageEdit('${st.id}')">
      <span class="name">${escapeHtml(st.name)}</span>
      <span class="dates">${st.start} ~ ${st.end}</span>
    </div>`).join('');
}

// ---------- goal ----------
function openGoalModal() {
  const g = data.goal || {};
  $('goalSchool').value = g.school || '';
  $('goalMajor').value = g.major || '';
  $('goalTotal').value = g.targetTotal != null ? g.targetTotal : '';
  $('goalLine').value = g.line != null ? g.line : '';
  $('goalNote').value = g.note || '';
  openModal('modalGoal');
}
function saveGoal() {
  data.goal = {
    school: $('goalSchool').value.trim(),
    major: $('goalMajor').value.trim(),
    targetTotal: $('goalTotal').value === '' ? null : Number($('goalTotal').value),
    line: $('goalLine').value === '' ? null : Number($('goalLine').value),
    note: $('goalNote').value.trim()
  };
  save(); closeModal('modalGoal'); renderHome(); showToast('已保存');
}

// ---------- settings ----------
function openSettings() {
  $('setNickname').value = data.settings.nickname || '';
  $('setExamDate').value = data.settings.examDate;
  $('setDark').checked = data.settings.theme === 'dark';
  renderAccentSwatches();
  renderSubjectList();
  renderStageList();
  openModal('modalSettings');
}
function renderAccentSwatches() {
  $('accentSwatches').innerHTML = ACCENTS.map(c =>
    `<button class="swatch ${c === data.settings.accent ? 'on' : ''}" style="background:${c}" onclick="setAccent('${c}')"></button>`).join('');
}
function setAccent(c) { data.settings.accent = c; save(); applyTheme(); renderAccentSwatches(); }
function renderSubjectList() {
  $('subjectList').innerHTML = data.subjects.map(s => `
    <div class="subject-row" onclick="openSubjectEdit('${s.id}')">
      <span class="dot" style="background:${s.color}"></span>
      <span class="name">${escapeHtml(s.name)}</span>
      <span class="mods">${s.target ? '目标 ' + s.target + ' 分' : ''} · ${s.modules.length} 模块</span>
    </div>`).join('');
}
function openSubjectEdit(id) {
  editingSubjectId = id;
  const s = subjectById(id) || { name: '', color: ACCENTS[0], target: '', modules: [] };
  $('subjectModalTitle').textContent = id ? '编辑科目' : '新增科目';
  $('subjectId').value = id || '';
  $('subjectName').value = s.name || '';
  $('subjectTarget').value = s.target != null ? s.target : '';
  $('subjectModules').value = (s.modules || []).join('\n');
  $('subjectChapters').value = (s.chapters || []).map(c => c.module + '：' + c.title).join('\n');
  editingSubjectColor = s.color || ACCENTS[0];
  renderSubjectSwatches();
  $('btnDeleteSubject').style.display = id ? '' : 'none';
  openModal('modalSubject');
}
function renderSubjectSwatches() {
  $('subjectSwatches').innerHTML = ACCENTS.map(c =>
    `<button class="swatch ${c === editingSubjectColor ? 'on' : ''}" style="background:${c}" onclick="editingSubjectColor='${c}';renderSubjectSwatches()"></button>`).join('');
}
function saveSubject() {
  const name = $('subjectName').value.trim();
  if (!name) { showToast('请输入科目名称'); return; }
  const modules = $('subjectModules').value.split('\n').map(x => x.trim()).filter(Boolean);
  const target = $('subjectTarget').value === '' ? null : Number($('subjectTarget').value);
  const id = $('subjectId').value || 's' + uid();
  const idx = data.subjects.findIndex(s => s.id === id);
  const prev = (idx >= 0 && Array.isArray(data.subjects[idx].chapters)) ? data.subjects[idx].chapters : [];
  const chapters = $('subjectChapters').value.split('\n').map(x => x.trim()).filter(Boolean).map(line => {
    const i = line.indexOf('：') >= 0 ? line.indexOf('：') : line.indexOf(':');
    const module = i > 0 ? line.slice(0, i).trim() : (modules[0] || '未分类');
    const title = i > 0 ? line.slice(i + 1).trim() : line;
    const old = prev.find(c => c.module === module && c.title === title);
    return { id: old ? old.id : uid(), module, title, round: old ? old.round : 0 };
  });
  const subject = { id, name, color: editingSubjectColor, target, modules, chapters };
  if (idx >= 0) data.subjects[idx] = { ...data.subjects[idx], ...subject };
  else data.subjects.push(subject);
  save(); closeModal('modalSubject'); renderSubjectList();
  renderHome(); renderPlan(); renderTimer(); renderProgress();
  showToast('已保存');
}
function deleteSubject() {
  const id = $('subjectId').value;
  if (!id) return;
  if (!confirm('删除该科目？相关待办、记录和错题也会一并删除。')) return;
  data.subjects = data.subjects.filter(s => s.id !== id);
  data.todos = data.todos.filter(t => t.subjectId !== id);
  data.sessions = data.sessions.filter(s => s.subjectId !== id);
  data.wrong = data.wrong.filter(w => w.subjectId !== id);
  if (timer.subjectId === id) timer.subjectId = null;
  save(); closeModal('modalSubject'); renderSubjectList();
  showToast('已删除');
}

function fillSubjectSelect(selId) {
  const sel = $(selId);
  sel.innerHTML = data.subjects.map(s => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join('');
}
function fillModuleSelect(subjectId) {
  const sel = $('wrongModule');
  const s = subjectById(subjectId);
  sel.innerHTML = (s && s.modules.length ? s.modules : ['未分类']).map(m => `<option value="${escapeHtml(m)}">${escapeHtml(m)}</option>`).join('');
}

function exportData() {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'kaoyan-backup-' + todayStr() + '.json';
  a.click();
  URL.revokeObjectURL(a.href);
}
function importData(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const obj = JSON.parse(reader.result);
      if (!obj || !Array.isArray(obj.subjects) || !obj.settings) throw new Error('bad');
      data = normalize(obj); save(); applyTheme();
      showToast('导入成功');
      switchView('home');
    } catch (e) { showToast('文件格式不正确'); }
  };
  reader.readAsText(file);
}
function resetAll() {
  if (!confirm('确定清空全部数据？此操作不可恢复。')) return;
  localStorage.removeItem(LS_KEY);
  data = defaultData();
  save(); applyTheme(); switchView('home');
  showToast('已清空');
}

// ---------- init ----------
function init() {
  applyTheme();
  document.querySelectorAll('.tab').forEach(el => el.addEventListener('click', () => switchView(el.dataset.view)));
  $('btnSettings').addEventListener('click', openSettings);
  document.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', () => closeModal(el.dataset.close)));
  $('btnSaveTodo').addEventListener('click', saveTodo);
  $('btnSaveWrong').addEventListener('click', saveWrong);
  $('wrongSubject').addEventListener('change', () => fillModuleSelect($('wrongSubject').value));
  $('btnAddSubject').addEventListener('click', () => openSubjectEdit(null));
  $('btnSaveSubject').addEventListener('click', saveSubject);
  $('btnDeleteSubject').addEventListener('click', deleteSubject);
  $('btnEditGoal').addEventListener('click', openGoalModal);
  $('btnSaveGoal').addEventListener('click', saveGoal);
  $('btnAddStage').addEventListener('click', () => openStageEdit(null));
  $('btnSaveStage').addEventListener('click', saveStage);
  $('btnDeleteStage').addEventListener('click', deleteStage);
  $('setNickname').addEventListener('change', e => { data.settings.nickname = e.target.value.trim(); save(); renderHome(); });
  $('setExamDate').addEventListener('change', e => { data.settings.examDate = e.target.value || '2027-12-25'; save(); renderHome(); });
  $('setDark').addEventListener('change', e => { data.settings.theme = e.target.checked ? 'dark' : 'light'; save(); applyTheme(); });
  $('btnExport').addEventListener('click', exportData);
  $('btnImport').addEventListener('click', () => $('fileImport').click());
  $('fileImport').addEventListener('change', e => { if (e.target.files[0]) importData(e.target.files[0]); e.target.value = ''; });
  $('btnReset').addEventListener('click', resetAll);
  $('btnTakePhoto').addEventListener('click', () => $('wrongPhotoCamera').click());
  $('btnPickPhoto').addEventListener('click', () => $('wrongPhotoGallery').click());
  $('wrongPhotoCamera').addEventListener('change', e => { onPhotoFile(e.target.files[0]); e.target.value = ''; });
  $('wrongPhotoGallery').addEventListener('change', e => { onPhotoFile(e.target.files[0]); e.target.value = ''; });
  $('btnClearPhoto').addEventListener('click', () => { currentWrongPhoto = null; updateWrongPhotoUI(); });
  renderHome();
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    try { navigator.serviceWorker.register('sw.js').catch(() => {}); } catch (e) {}
  });
}

init();
