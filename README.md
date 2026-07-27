# QQ 空间静态备份站点

> 基于 [ShunCai/QZoneExport](https://github.com/ShunCai/QZoneExport) 导出的 QQ 空间纯静态站点备份，并在此基础上做了性能优化与暗黑模式适配。

备份对象为 QQ 空间 `1601913793`（实验+梅园初級中學校園墻），包含 **715 条说说**、**45 条留言**、**136,538 次访客记录**。

## 数据概览

| 模块 | 条数 | 说明 |
|------|------|------|
| 说说 (Messages) | 715 | 按年份分页加载（2019–2022） |
| 留言板 (Boards) | 45 | 含"那年今日" |
| 访客 (Visitors) | 136,538 | 历史访客记录 |
| 日志 / 日记 / 相册 / 视频 / 分享 / 收藏 / 好友 | 0 | 备份时未导出 |

## 功能特性

- **暗黑模式**：全站支持明暗主题切换，暗黑模式下文字、卡片、代码块均正确适配
- **侧边栏目录**：说说页面左侧导航栏预渲染所有年份/月份的完整目录，支持点击跳转
- **图片懒加载**：基于 IntersectionObserver，内容图片和头像均按视口触发加载，减少首屏请求
- **那年今日**：说说、留言模块自动展示历史同月同日的条目
- **分页加载**：说说数据按年份拆分为多个 JS 文件，滚动触底异步加载下一年份
- **首页加速**：移除失效的 `clicklove.min.js` 依赖，非关键脚本改为 async/defer，首屏可交互时间从 2.6s 降至 0.2s

## 技术栈

| 依赖 | 版本 | 用途 |
|------|------|------|
| jQuery | 3.6 | DOM 操作、AJAX |
| Bootstrap | 4.6 | 响应式布局、组件 |
| lightGallery | 2.3 | 图片灯箱 |
| template.js | - | 客户端模板渲染 |
| lodash | 4.17 | 工具函数 |
| jquery_lazyload | 2.0.0-rc.2 | 图片懒加载 |

无构建过程，所有 HTML / JS / CSS 均为预渲染产物，可直接通过浏览器或任意静态服务器打开。

## 目录结构

```
.
├── index.html              # 个人中心首页
├── Common/                 # 公共模块
│   ├── css/common.css      # 全站样式（含暗黑模式）
│   ├── js/common.js        # API 命名空间 + 模板
│   ├── js/sidebar.js       # 侧边栏目录
│   └── json/config.js      # 导出配置
├── Messages/               # 说说
│   ├── index.html
│   ├── js/messages.js
│   └── json_backup/        # 按年份拆分的数据
│       ├── messages_2019.js
│       ├── messages_2020.js
│       ├── messages_2021.js
│       └── messages_2022.js
├── Boards/                 # 留言板
├── Visitors/               # 访客
├── Blogs/                  # 日志
├── Diaries/                # 日记
├── Albums/                 # 相册
├── Videos/                 # 视频
├── Shares/                 # 分享
├── Favorites/              # 收藏
├── Friends/                # 好友
├── Statistics/             # 统计
├── docs/                   # GitHub Pages 配置
└── CODE_WIKI.md            # 详细代码文档
```

## 本地运行

由于数据以 JS 文件形式通过 `<script>` 标签加载，建议通过 HTTP 服务器访问而非 `file://` 协议：

```bash
# Python
python -m http.server 8000

# 或 Node
npx http-server -p 8000 -c-1
```

然后访问 http://localhost:8000/

## 优化记录

| 优化项 | 效果 |
|--------|------|
| 移除失效的 `clicklove.min.js` | 首屏渲染不再阻塞 2.5s |
| 天气插件移至 body 末尾并改 async | 消除 head 中同步脚本阻塞 |
| 头像与内容图片懒加载 | 首屏请求从 800+ 降至 250 左右 |
| 侧边栏预渲染全部年份目录 | 未加载年份也可点击跳转 |
| 暗黑模式覆盖 `pre.card-text` | 修复说说正文在暗黑模式下仍为黑色 |
| 说说数据按年份异步加载 | 解决 `$.getScript` 在 `file://` 下被 CORS 阻止的问题 |

## 致谢

- [ShunCai/QZoneExport](https://github.com/ShunCai/QZoneExport) — QQ 空间导出助手
