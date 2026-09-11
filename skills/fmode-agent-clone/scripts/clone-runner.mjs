#!/usr/bin/env node
/**
 * fmode-agent-clone runner — 数字生命克隆：同步/恢复/建仓
 * 零依赖（Node ≥18）。凭据 4 级解析，密钥本体永不入仓。
 *
 * 用法:
 *   node clone-runner.mjs sync   --name yuyang [--level L1,L2] [--dry]
 *   node clone-runner.mjs restore --repo <url> --into <dir>
 */
import fs from 'fs';
import os from 'os';
import path from 'path';
import { execSync } from 'child_process';

const HOME = os.homedir();

/** 5 级凭据解析（第0级为文档级自举说明）:
 * 第0级: sessionToken —— ⚠️ Gogs API 不接受 sessionToken（网页 cookie i_like_gogs 仅网页会话有效），
 *        且 Gogs 无"sessionToken 换 git token"的签发端点 → git token 必须一次性初始化（见 README）。
 * 第1-4级: env → ~/.fmode/config.json → ./.fmode/config.json → git credential helper */
export function resolveGit() {
  const out = { user: null, token: null, apiBase: 'https://git.fmode.cn/api/v1' };
  if (process.env.FMODE_GIT_TOKEN) { out.token = process.env.FMODE_GIT_TOKEN; }
  for (const p of [path.join(HOME, '.fmode', 'config.json'), path.join(process.cwd(), '.fmode', 'config.json')]) {
    try {
      const j = JSON.parse(fs.readFileSync(p, 'utf8'));
      if (j.gitToken) out.token = j.gitToken;
      if (j.gitUser) out.user = j.gitUser;
      if (j.gitApiBase) out.apiBase = j.gitApiBase;
    } catch {}
  }
  if (!out.user) {
    try { out.user = execSync('git config user.name', { encoding: 'utf8' }).trim(); } catch {}
  }
  return out;
}

/** 默认同步清单（L1 核心 / L2 能力 / L3 记录 / L4 状态） */
export function collectPaths(level = ['L1','L2']) {
  const D = '/opt/data';
  const map = {
    L1: [`${D}/SOUL.md`, `${D}/MEMORY.md`, `${D}/USER.md`],
    L2: [`${D}/skills`, `${D}/home/.claude/skills`].filter(p => fs.existsSync(p)),
    L3: [`${D}/home/.claude/projects`, `${D}/.hermes/sessions`].filter(p => fs.existsSync(p)),
    L4: [`${D}/.hermes/cron`].filter(p => fs.existsSync(p)),
  };
  return level.flatMap(l => map[l] || []);
}

function sh(cmd, cwd) {
  return execSync(cmd, { encoding: 'utf8', cwd, stdio: ['ignore','pipe','pipe'], timeout: 120000 });
}

function ensureRepo(name, g) {
  const url = `${g.apiBase}/admin/users/${g.user}/repos`;
  if (!g.token) {
    console.error('git token 缺失——Gogs API 不接受 sessionToken 自举，请先完成一次性初始化（见 README「凭据」章节）：');
    console.error(`  curl -u "<user>:<password>" -X POST "${g.apiBase.replace('/api/v1', '')}/api/v1/users/<user>/tokens" -H "Content-Type: application/json" -d '{"name":"agent-clone"}'`);
    return false;
  }
  try {
    const r = sh(`curl -s --max-time 20 -X POST -H "Authorization: token ${g.token}" -H "Content-Type: application/json" -d '{"name":"${name}","private":true}' "${url}"`);
    return /"name"\s*:\s*"/.test(r) || /already/i.test(r);
  } catch { return false;
  }
}

function main() {
  const a = process.argv.slice(2);
  const cmd = a[0];
  const argOf = (n) => { const i = a.indexOf(n); return i >= 0 ? a[i+1] : null; };
  const g = resolveGit();
  if (cmd === 'sync') {
    const name = argOf('--name') || (g.user || 'agent').replace(/[^a-z0-9-]/gi, '').toLowerCase();
    const level = (argOf('--level') || 'L1,L2,L3').split(',');
    const dry = a.includes('--dry');
    const repoName = `agent-${name}`;
    const remote = argOf('--repo') || `https://${g.user}:${g.token}@git.fmode.cn/${g.user}/${repoName}.git`;
    const work = path.join(HOME, '.agent-clone', repoName);
    // 1) clone or init
    if (!fs.existsSync(path.join(work, '.git'))) {
      fs.mkdirSync(work, { recursive: true });
      try { sh(`git clone ${remote} ${work}`); } catch { sh(`git init -b main ${work}`); sh(`git remote add origin ${remote} ${work}`); }
    } else { sh(`git pull --rebase origin main || true`, work); }
    // 2) 汇集文件
    const targets = collectPaths(level);
    const manifest = [];
    for (const t of targets) {
      if (!fs.existsSync(t)) continue;
      const base = path.join(work, path.basename(t));
      sh(`mkdir -p "${path.dirname(base)}" && cp -r "${t}" "${path.dirname(base)}/"`);
      manifest.push({ src: t, dst: path.basename(t) });
    }
    // 3) credentials-map（密钥位置指针, 不含密钥值）
    const credMap = `# 密钥位置索引（不含密钥本体）\n- fmode token: ${HOME}/.fmode/config.json (fmodeApiToken)\n- claude token: ${HOME}/.claude/settings.json (env.ANTHROPIC_AUTH_TOKEN)\n- git tokens: /opt/data/.fmode-harness-agent/knowledge/lives/git-tokens.txt\n`;
    fs.writeFileSync(path.join(work, 'credentials-map.md'), credMap);
    fs.writeFileSync(path.join(work, 'sync-manifest.json'), JSON.stringify({ at: new Date().toISOString(), name, level, manifest }, null, 2));
    if (dry) { console.log('[dry] 同步项:', manifest.length); return; }
    // 4) commit+push
    try { sh(`git add -A && git -c user.name="${g.user}" -c user.email="${g.user}@fmode.cn" commit -m "clone sync ${new Date().toISOString().slice(0,16)}"`, work); } catch {}
    if (!g.token) {
      console.error('push 失败: git token 缺失（FMODE_GIT_TOKEN 或 ~/.fmode/config.json 的 gitToken）。Gogs 不支持 sessionToken 自举，请先一次性初始化 token（见 README「凭据」章节）。');
      return;
    }
    try { if (ensureRepo(repoName, g)) { sh(`git push -u origin main`, work); console.log('✅ 已同步', manifest.length, '项 →', repoName); } }
    catch (e) { console.error('push 失败:', String(e).slice(0, 200)); }
    return;
  }
  if (cmd === 'restore') {
    const repo = argOf('--repo'); const into = argOf('--into') || '/opt/data';
    if (!repo) { console.error('用法: restore --repo <url> --into <dir>'); process.exit(2); }
    sh(`git clone ${repo} ${into}/.agent-restore`);
    console.log('已 clone 到', into + '/.agent-restore', '—— 按 sync-manifest.json 反向拷贝到对应路径即可');
    return;
  }
  console.log('用法: sync | restore');
}

main();
