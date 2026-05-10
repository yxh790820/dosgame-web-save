# dosgame-web-save 维护说明

基于 `oldiy/dosgame-web-docker` 镜像的自定义修改版。

目标：在原 `dosgame-web` 的游戏页面上增加浏览器本地存档的导出、导入、清除功能。

GitHub 仓库：https://github.com/yxh790820/dosgame-web-save

## 部署方式

### 预构建镜像（推荐）

从 [GitHub Releases](https://github.com/yxh790820/dosgame-web-save/releases) 下载 `dosgame-web-save(latest).syno.tar`，然后：

```bash
docker load -i dosgame-web-save(latest).syno.tar
docker compose up -d
```

### 自行构建

```bash
docker compose build
docker compose up -d
```

`compose.yaml` 没有写死 `container_name`，方便用不同项目名重建，避免旧容器名冲突。

## 重要路径

游戏库挂载：

```text
/your/game/library -> /app/static/games
```

游戏库结构：

```text
/app/static/games/games.json
/app/static/games/bin/*.zip
/app/static/games/img/*
```

游戏文件推荐使用 [chinese-dos-games](https://github.com/rwv/chinese-dos-games) 项目的 `bin/` 和 `img/`，然后用本仓库的 `games.json` 替换原项目的（本仓库版本增加了游戏分类）。

## 关键改动

主要改动文件：

```text
templates/game.html
static/js/save-manager.js
templates/games.html
game_infos.py
Dockerfile
compose.yaml
```

`templates/game.html` 增加了三个按钮：

```text
导出存档
导入存档
清除存档
```

并注入：

```javascript
window.DOSGAME_SAVE_CONFIG = {
    dbName: game identifier,
    gameName: Chinese display name
};
```

`static/js/save-manager.js` 负责：

- 从浏览器 IndexedDB 读取当前游戏存档
- 导出 `.dossave` 文件
- 导入 `.dossave` 文件
- 删除当前游戏在本浏览器里的 IndexedDB 存档

## 存档机制

原项目的 Emularity/DOSBox 运行层已经使用：

```javascript
DosBoxLoader.fileSystemKey(game_info["identifier"])
```

底层 `static/emularity/loader.js` 会用 BrowserFS + IndexedDB 按 `identifier` 保存写入变化。

本项目没有把存档写到服务端。存档仍在浏览器本地 IndexedDB 中。

换电脑、换浏览器、清浏览器数据前，需要在游戏页点"导出存档"，得到 `.dossave` 文件。新电脑打开同一个游戏后点"导入存档"，再刷新页面生效。

## 镜像构建

Dockerfile 基于原镜像：

```dockerfile
FROM docker.1ms.run/oldiy/dosgame-web-docker:latest
```

只覆盖 `/app` 下的网页代码和静态资源。仅内置 `games.json` 游戏元数据，游戏 zip 文件需从外部挂载。

如果以后不能拉取原镜像，但已经有 `dosgame-web-save(latest).syno.tar`，优先直接 `docker load`，不要重新 build。

## 注意事项

- 不要把存档写回原始游戏 zip。
- 不要删除挂载的游戏库，这是真实数据。
- 当前端口映射是 `262:262`。如果需要避开端口冲突，只改 `compose.yaml` 的左侧端口，例如改成 `263:262`。
- 如果导入存档后看不到效果，刷新游戏页面。
- `.dossave` 文件只应该导入到同一个游戏 identifier。

## 分类功能

游戏列表页 `/games/` 已增加分类筛选。

分类来源已经合并到：

```text
static/games/games.json
```

`game_infos.py` 启动时只读取 `games.json`。每个游戏条目里有 `category` 和 `categoryLabel` 字段；根级还有 `categoryLabels` 和 `categoryOrder`。

`templates/games.html` 以卡片网格显示游戏列表：封面、游戏名、分类。没有封面时使用：

```text
static/img/game-placeholder.svg
```

历史来源是 `applist.csv` 加 `category_overrides.json`。这些分类已经写入 `games.json`，运行时不再需要单独保留这两个文件。

类型码映射：

```text
ACT 动作
AVG 冒险
HGA 成人
PUZ 益智
RPG 角色扮演
RTS 即时战略
SIM 模拟
SLG 策略
SPG 战棋
UNC 未分类
```

注意：`SPG` 在这套 DOS 分类表里按实际内容显示为"战棋"，不是体育。

如果以后分类不准，优先检查：

```text
static/games/games.json
```

修改对应游戏的 `category` 和 `categoryLabel` 即可。

## 仓库结构说明

- `README.md` — 面向用户的说明文档，包含新手帮助、部署方式、功能说明
- `AI_MAINTENANCE_NOTES.md` — 本文件，供 AI 辅助维护时参考
- `app.py` — Flask 应用主入口
- `game_infos.py` — 游戏数据加载和分类处理
- `templates/` — Jinja2 模板
- `static/js/save-manager.js` — 存档管理核心逻辑
- `static/emularity/` — DOSBox 模拟器前端（来自原镜像）
- `Dockerfile` — 基于原镜像构建
- `compose.yaml` — Docker Compose 部署配置
