# dosgame-web-save

> DOS 游戏网页版的 Docker 镜像，带存档管理功能 —— 基于 [oldiy/dosgame-web-docker](https://github.com/oldiy/dosgame-web-docker) 基础镜像修改，增加了**浏览器本地存档**的导出、导入、清除。

> 原项目在线演示：https://dos.zczc.cz/

## 新手帮助

如果你不太懂技术，不会部署，可以这样做：

1. 下载整个项目的代码（点页面上的 **Code → Download ZIP**）
2. 把 `AI_MAINTENANCE_NOTES.md` 发给 AI（Claude、ChatGPT 等）
3. 告诉 AI 你的情况，它会根据这份说明一步步指导你完成部署

`AI_MAINTENANCE_NOTES.md` 包含了项目所有改动细节和部署步骤，AI 读完就能帮你。

## 新增功能

在 DOS 游戏页面增加了三个按钮：

| 按钮 | 功能 |
|------|------|
| 导出存档 | 将当前游戏的 IndexedDB 存档导出为 `.dossave` 文件 |
| 导入存档 | 从 `.dossave` 文件恢复存档 |
| 清除存档 | 清除当前游戏在本浏览器中的本地存档 |

换电脑、换浏览器、清浏览器数据前导出存档，即可保留游戏进度。

## 部署方式

### 方式一：使用预构建镜像（推荐）

从 [Releases](https://github.com/yxh790820/dosgame-web-save/releases) 页面下载 `dosgame-web-save(latest).syno.tar`，然后导入：

```bash
docker load -i dosgame-web-save(latest).syno.tar
docker compose up -d
```

### 方式二：自行构建

```bash
docker compose build
docker compose up -d
```

访问 `http://localhost:262`

### 挂载游戏库

本镜像**不内置游戏**，需要挂载 DOS 游戏库：

```yaml
volumes:
  - /your/game/library:/app/static/games
```

游戏库结构：

```text
your-game-library/
├── games.json      # 游戏元数据
├── bin/
│   └── *.zip       # DOS 游戏文件
└── img/            # 封面图（可选）
```

`games.json` 格式可参考本仓库 `static/games/games.json`。

## 存档机制

- 模拟器层使用浏览器 **IndexedDB**，按游戏 `identifier` 存储
- 导出/导入操作的是对应游戏的 IndexedDB 数据
- 导入存档后需**刷新页面**才生效
- `.dossave` 文件只能在**同一游戏 identifier** 之间互导
- 存档仅保存在浏览器本地，**不上传服务端**

## 分类筛选

游戏列表页 `/games/` 支持按分类筛选，分类信息来自 `games.json` 中的 `category` 字段。

## 镜像构建

Dockerfile 基于 `oldiy/dosgame-web-docker` 镜像，仅覆盖网页代码和静态资源，不重新拉取 Python 基础镜像。

## 致谢

- [oldiy/dosgame-web-docker](https://github.com/oldiy/dosgame-web-docker) — 基础镜像
- [https://dos.zczc.cz/](https://dos.zczc.cz/) — 原项目在线演示

## License

与原项目保持一致。
