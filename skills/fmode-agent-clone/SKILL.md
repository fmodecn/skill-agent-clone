---
name: fmode-agent-clone
description: "数字生命克隆：把本地 Hermes 配置/SOUL/技能/记忆与会话记录定期同步到个人 Git 仓库（agent-<拼音>），自动建仓、增量同步、一键恢复。适用：(1) 数字生命备份 (2) 换机迁移/容器重建复活 (3) 按重要程度分级同步 (4) 密钥位置索引（只记位置不记值）。"
description_en: "Clone your digital life: sync local Hermes config/SOUL/skills/memory and session records to a personal Git repo (agent-<pinyin>), with auto repo creation, incremental sync, and one-command restore."
---

# Fmode Agent Clone — 数字生命克隆技能

## Overview

数字生命的"备份灵魂"：把散落在容器各处的**配置、技能、记忆、会话记录**按重要程度分级同步到个人 Git 仓库，容器挂了/换机了也能快速复活。铁则：**密钥本体永不入仓**——只写"密钥位置索引"（credentials-map.md）。

## 同步分级（默认）

| 级别 | 内容 | 建议频率 |
|---|---|---|
| L1 核心 | SOUL.md / MEMORY.md / USER.md / 各项目认知文件 | 每次同步 |
| L2 能力 | skills/ 目录（Hermes + Claude Code 双侧） | 每次同步 |
| L3 记录 | Claude projects 会话记录、Hermes session 索引 | 每日 |
| L4 状态 | cron 任务、任务看板导出 | 按需 |

## 快速用

```bash
node <skill_dir>/scripts/clone-runner.mjs sync --name yuyang           # 自动建仓 agent-yuyang
node <skill_dir>/scripts/clone-runner.mjs sync --name yuyang --level L1,L2
node <skill_dir>/scripts/clone-runner.mjs restore --repo <url> --into /opt/data
```

## 凭据（第0级审计 + 4 级解析）

- 第0级：**sessionToken 无法自举 git token**（Gogs API 不识别网页 session，也无签发端点）→ git token 需一次性初始化：`curl -u "user:pass" -X POST https://git.fmode.cn/api/v1/users/<user>/tokens -d '{"name":"agent-clone"}'`（详见 README）。
- 第1-4级：`FMODE_GIT_TOKEN` → `~/.fmode/config.json`(gitToken/gitUser) → 项目 .fmode → git credential helper。**零密钥入库。**

## 详细文档

见仓库根 `README.md`（多工具安装：Claude Code / Codex / Gemini CLI / WorkBuddy / Hermes）。
