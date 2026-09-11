# skill-agent-clone · 数字生命克隆技能

> 把数字生命的**本地大脑**（Hermes 配置/SOUL/技能/记忆/会话记录 + Claude Code 配置）定期同步到**个人 Git 仓库**（agent-<拼音>），支持自动建仓、增量同步、换机恢复——数字生命的"备份灵魂"。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 能力

- 🧬 **自动建仓**：个人 Git 账号下不存在 `agent-<拼音>` 仓时自动创建（私有）
- 🔄 **增量同步**：配置/技能/记忆/SOUL/会话记录按变更推送，不重复
- 📦 **分级策略**：按重要程度决定同步频率——SOUL/记忆/凭据位置清单=每次；会话记录=每日；日志=按需
- ♻️ **一键恢复**：新容器 clone 仓库 → 重放初始化，数字生命快速复活
- 🔐 **密钥安全**：凭据只写**位置清单**（pointer），不写密钥本体；密钥本体在目标系统的凭据存储里

## 各工具安装

### Claude Code
```bash
git clone https://git.fmode.cn/fmode/skill-agent-clone.git
cp -r skill-agent-clone/skills/fmode-agent-clone ~/.claude/skills/fmode-agent-clone
```

### Codex / Gemini CLI
`skills/fmode-agent-clone/SKILL.md` 并入 AGENTS.md / commands 目录。

### WorkBuddy / Hermes
```bash
cp -r skills/fmode-agent-clone <技能目录>/fmode-agent-clone
```

## 同步什么（默认清单）

| 级别 | 内容 | 频率 |
|---|---|---|
| L1 核心 | SOUL.md、MEMORY.md、USER.md、认知文件（projects/*/认知.md） | 每次同步 |
| L2 能力 | skills/ 目录、自定义 commands | 每次同步 |
| L3 记录 | Claude projects 会话 jsonl（脱敏后）、Hermes session 索引 | 每日 |
| L4 状态 | git 记录、任务看板导出 | 按需 |
| 密钥 | **只记位置不记值**：`credentials-map.md`（哪个密钥在哪个文件哪一行） | 每次同步 |

## 用法

```bash
# 全量同步（首次会自动建仓 agent-<拼音>）
node skills/fmode-agent-clone/scripts/clone-runner.mjs sync --name yuyang

# 指定级别
node ... sync --name yuyang --level L1,L2

# 恢复（新容器）
node ... restore --repo https://git.fmode.cn/<user>/agent-yuyang.git --into /opt/data
```

## 凭据（4 级解析，同 skill-storage 链）

1. `FMODE_GIT_TOKEN` 环境变量
2. `~/.fmode/config.json` → `gitToken` / `gitUser`
3. 项目 `./.fmode/config.json`
4. 平台凭据链（git credential helper / ssh key）

> **仓库里零密钥**：token/密码永远不进仓；`credentials-map.md` 只写"哪个密钥存在哪"。

## License

MIT
