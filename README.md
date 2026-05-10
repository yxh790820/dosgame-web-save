# dosgame-web-save

[oldiy/dosgame-web-docker](https://github.com/oldiy/dosgame-web-docker) 的增强分支，增加了**浏览器本地存档管理**功能（导出/导入/清除）。

## 新增功能

在 DOS 游戏页面增加了三个按钮：

| 按钮 | 功能 |
|------|------|
| 导出存档 | 将当前游戏的 IndexedDB 存档导出为 `.dossave` 文件 |
| 导入存档 | 从 `.dossave` 文件恢复存档 |
| 清除存档 | 清除当前游戏在本浏览器中的本地存档 |

换电脑、换浏览器、清浏览器数据前导出存档，即可保留游戏进度。

## 快速开始

```bash
# 构建镜像
docker compose build

# 启动
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

Dockerfile 基于 `oldiy/dosgame-web-docker` 镜像，仅覆盖网页代码和静态资源。

## 致谢

- [oldiy/dosgame-web-docker](https://github.com/oldiy/dosgame-web-docker) — 原项目

## License

与原项目保持一致。
