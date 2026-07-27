# QQ 空间备份项目 Code Wiki

> 本文档基于仓库 `-2--main` 的源码自动梳理生成，描述项目整体架构、模块职责、关键类与函数、依赖关系及运行方式。
>
> 项目本质是 [ShunCai/QZoneExport](https://github.com/ShunCai/QZoneExport)（QQ 空间导出助手）针对 QQ 号 `1601913793`（昵称：实验+梅园初級中學校園墻）生成的一份**纯静态站点备份**，而非导出工具本身。

---

## 目录

- [1. 项目概览](#1-项目概览)
- [2. 整体架构](#2-整体架构)
- [3. 目录结构](#3-目录结构)
- [4. 公共模块（Common）](#4-公共模块common)
- [5. 业务功能模块](#5-业务功能模块)
- [6. 数据层（json/*.js）](#6-数据层jsonjs)
- [7. 模板系统（TPL）](#7-模板系统tpl)
- [8. 依赖关系](#8-依赖关系)
- [9. 运行方式](#9-运行方式)
- [10. 关键流程](#10-关键流程)

---

## 1. 项目概览

| 属性 | 说明 |
| --- | --- |
| 项目类型 | 纯静态前端站点（HTML + CSS + 原生 JS） |
| 项目来源 | 由 `QZoneExport` 工具自动生成，对应仓库 [wyxshisb/QQ-_1601913793](https://github.com/wyxshisb/QQ-_1601913793) |
| 备份对象 | QQ 空间 `1601913793`（公安县实验中学和梅园中学校园墙） |
| 数据规模 | 说说 715 条、留言 45 条、访客 136538 次，其余模块为 0 |
| 技术栈 | jQuery 3.6 + Bootstrap 4.6 + lightGallery 2.3 + template.js + lodash 4.17 |
| 构建方式 | 无构建过程，所有 HTML / JS / CSS 均为预渲染产物，可直接通过浏览器或任意静态服务器打开 |
| 文档站点 | `docs/` 目录配置 Jekyll 主题 `jekyll-theme-cayman`，用于 GitHub Pages 展示 |

### 核心特征

1. **零后端**：所有数据以 `window.<globalVar> = {...}` 形式写入 `json/*.js` 文件，HTML 通过 `<script>` 标签同步加载。
2. **预渲染 + 客户端渲染混合**：列表类内容（说说、留言等）已预渲染进 HTML；详情类（日志详情、相册照片）使用 `template.js` 在客户端根据 URL 参数动态渲染。
3. **统一命名空间**：所有公共能力挂在全局 `API` 对象上，模板字符串挂在全局 `TPL` 对象上。
4. **那年今日**：说说、留言、分享模块在加载时会基于时间字段计算历史同月同日的条目并插入到页面顶部。

---

## 2. 整体架构

```
┌──────────────────────────────────────────────────────────────┐
│                       浏览器 (Browser)                        │
└──────────────────────────────────────────────────────────────┘
                            │
            ┌───────────────┼─────────────────┐
            ▼               ▼                 ▼
     ┌─────────────┐ ┌────────────┐  ┌──────────────────┐
     │  index.html │ │ Messages/  │  │  Boards/Blogs/   │
     │  (个人中心) │ │ index.html │  │  Videos/...      │
     └─────────────┘ └────────────┘  └──────────────────┘
            │               │                 │
            └───────┬───────┴────────┬────────┘
                    ▼                ▼
        ┌──────────────────┐  ┌──────────────────┐
        │   Common/js/     │  │  各模块 js/       │
        │  common.js (API) │  │  <module>.js      │
        │  sidebar.js      │  │  <module>info.js  │
        └──────────────────┘  └──────────────────┘
                    │                │
                    ▼                ▼
        ┌──────────────────┐  ┌──────────────────┐
        │  Common/json/    │  │  各模块 json/     │
        │  config.js       │  │  <module>.js      │
        │  user.js         │  │ (window.<var>)    │
        └──────────────────┘  └──────────────────┘
                    │
                    ▼
        ┌──────────────────────────────────────┐
        │  CDN 依赖（jQuery/Bootstrap/         │
        │  lightGallery/template.js/lodash/…） │
        └──────────────────────────────────────┘
```

### 架构层次

| 层次 | 位置 | 职责 |
| --- | --- | --- |
| 入口层 | 根目录 `index.html`、各模块 `index.html` | 页面骨架、CDN 引入、模块脚本加载 |
| 公共层 | `Common/` | 全局样式、工具函数、模板、配置、用户信息 |
| 业务层 | 各业务模块目录 | 模块特定的初始化脚本与数据 |
| 数据层 | `*/json/*.js` | 以 JS 全局变量形式存储的备份数据 |
| 资源层 | `*/images/` | 表情图、留言图、相册图、视频封面等媒体资源 |

---

## 3. 目录结构

```
-2--main/
├── index.html                  # 个人中心首页，列出所有模块入口与计数
├── .gitattributes              # LF 行尾归一化
├── CODE_WIKI.md                # 本文档
│
├── Common/                     # 公共资源
│   ├── css/common.css          # 全局样式
│   ├── images/                 # 首页背景图、loading.gif 等
│   ├── js/
│   │   ├── common.js           # API 命名空间 + TPL 模板（核心文件，约 2500 行）
│   │   └── sidebar.js          # 左侧目录自动生成
│   └── json/
│       ├── config.js           # window.QZone_Config 导出配置
│       └── user.js             # window.userInfo 用户档案
│
├── Messages/                   # 说说模块（715 条）
│   ├── index.html              # 主页（含预渲染内容）
│   ├── 2019.html ~ 2022.html   # 按年份分页
│   ├── js/messages.js          # 模块初始化脚本
│   ├── json/messages.js        # window.messages = [...]
│   └── images/                 # 说说图片（数百张 .png/.jpeg/.gif）
│
├── Boards/                     # 留言板（45 条）
│   ├── index.html / 2019~2022.html
│   ├── js/boards.js
│   ├── json/boards.js          # window.boardInfo = {items, authorInfo, total}
│   └── images/                 # 留言中的表情图（50 张 .gif）
│
├── Blogs/                      # 日志模块（0 条，结构完整）
│   ├── index.html              # 日志列表
│   ├── info.html               # 日志详情（根据 ?blogId 渲染）
│   ├── js/blogs.js             # 列表/表格双视图
│   ├── js/bloginfo.js          # 详情页初始化
│   └── json/blogs.js           # window.blogs = []
│
├── Diaries/                    # 私密日记（0 条，结构完整）
│   ├── js/diaries.js           # 复用日志列表模板
│   ├── js/diaryinfo.js         # 复用日志详情逻辑
│   └── json/diaries.js
│
├── Albums/                     # 相册模块（0 条，结构完整）
│   ├── js/albums.js            # 相册列表交互
│   └── js/photos.js            # 单相册照片画廊
│
├── Videos/                     # 视频模块（0 条，结构完整）
│   ├── index.html
│   ├── js/videos.js            # lightGallery 视频画廊
│   └── json/videos.js          # window.videos = []
│
├── Shares/                     # 分享模块（0 条，结构完整）
│   ├── index.html
│   ├── js/shares.js
│   └── json/shares.js          # window.shares = []
│
├── Favorites/                  # 收藏夹（0 条，结构完整）
│   └── js/favorites.js
│
├── Friends/                    # 好友模块（0 条，结构完整）
│   └── js/friends.js           # 列表/表格 + 虚拟分组
│
├── Visitors/                   # 访客模块（仅总数 136538，无明细）
│   ├── index.html
│   ├── js/visitors.js          # 空文件
│   └── json/visitors.js        # window.visitorInfo = {items:[], total, totalPage}
│
├── Statistics/                 # 统计模块（未完成）
│   └── js/statistics.js        # 仅有占位函数
│
└── docs/                       # GitHub Pages 配置
    ├── _config.yml             # theme: jekyll-theme-cayman
    └── index.md                # Pages 默认欢迎页
```

> 注：当某模块数据量为 0 时，导出工具不会生成 `index.html`（如 `Albums/`、`Diaries/`、`Favorites/`、`Friends/`、`Statistics/`），但模块的 `js/` 目录仍保留以备未来填充数据后即可启用。

---

## 4. 公共模块（Common）

公共模块是整个站点的核心，提供所有模块共享的工具函数、模板、配置与样式。

### 4.1 [Common/js/common.js](file:///c:/Users/15572/Music/-2--main/Common/js/common.js)

本文件是项目最核心的脚本，约 2500 行，定义了：

1. **原型扩展**（位于文件顶部）
   - `Date.prototype.format(fmt)`：日期格式化，支持 `yyyy-MM-dd hh:mm:ss.S` 等。
   - `String.prototype.format(args)`：字符串模板替换，支持数组、对象、多层嵌套属性。
   - `String.prototype.replaceAll(search, target)`：全局正则替换。
   - `Array.prototype.getIndex(val, field)`：按值或字段查找索引。
   - `Array.prototype.remove(val, field)`：按值或字段删除元素。

2. **微信表情数据 `emojis`**：包含约 60 个微信新表情的元数据（`index/key/cn/en/image`），并在加载后构建 `emotionMap` 反查表。

3. **`parseEmoji(content)`**：将文本中的微信表情占位符（如 `[奸笑]`）解析为带图片的片段列表。

4. **全局 `API` 命名空间**（核心）：

#### 4.1.1 `API.Utils` — 工具类

| 方法 | 签名 | 说明 |
| --- | --- | --- |
| `getUrlParam` | `(name) => string\|null` | 从当前 URL query 中读取参数 |
| `toParams` | `(url) => object` | 将 URL 字符串解析为参数对象 |
| `toUrl` | `(url, params) => string` | 将参数对象拼接到 URL |
| `formatDate` | `(time, str?) => string` | 将秒级时间戳格式化为日期字符串，默认 `yyyy-MM-dd hh:mm:ss` |
| `base64ToUtf8` | `(str) => string` | Base64 解码（UTF-8 安全） |
| `utf8ToBase64` | `(str) => string` | Base64 编码（UTF-8 安全） |
| `initTable` | `(tableId, columns, data, options)` | 基于 Bootstrap Table 初始化表格 |
| `getLink` | `(url, text, type?) => string` | 生成 HTML/Markdown 超链接 |
| `getImagesMarkdown` | `(url, title?) => string` | 生成 Markdown 图片语法 |
| `getImageHTML` | `(url) => string` | 生成 HTML `<img>` 标签 |
| `groupedByTime` | `(data, timeField, type)` | 按时间分组（all/year/month/day），返回 `Map` |
| `groupedByField` | `(data, field) => Map` | 按指定字段分组 |
| `newUid` | `() => string` | 生成标准 UUID v4 |
| `newSimpleUid` | `(len?, radix?) => string` | 生成短 UUID |
| `formatFileSize` | `(size, pointLength?, units?) => string` | 格式化文件大小为带单位的字符串 |
| `sumYearItemSize` | `(yearMaps) => number` | 递归计算年份分组中的总条目数 |

#### 4.1.2 `API.Common` — 公共业务方法

| 方法 | 说明 |
| --- | --- |
| `getUserUrl(uin)` | 拼接 QQ 空间主页地址 `https://user.qzone.qq.com/<uin>` |
| `getUserLogoUrl(uin)` | 拼接 QQ 头像 URL（基于 `qlogo*.store.qq.com`） |
| `escHTML(content)` | HTML 特殊字符转义（`& < > "`） |
| `getURLTitle(item, index)` | 获取分享来源的标题字段 |
| `formatTopic(content, type)` | 转换 `#话题#`，生成可点击的搜索链接 |
| `formatEmoticon(content, type)` | 转换 `[em]eXXX[/em]` QQ 表情码为 `<img>` |
| `formatMention(content, type)` | 转换 `@{uin,nick,who}` 提及为用户链接 |
| `formatWxEmoji(content, type)` | 转换微信新表情为图片，图片走 jsDelivr CDN |
| `formatContent(item, type, isRt, isSupportedHtml, isEscHTML)` | 综合内容转换：转义 + 话题 + 表情 + @ + 微信表情；支持字符串或 `conlist` 结构 |
| `getUserLink(uin, nickName, type)` | 用户空间超链接 |
| `getMessageUrl(uin)` | `tencent://message/?uin=` 唤起 QQ 聊天 |
| `getMessageLink(uin, nickName, type)` | 唤起聊天的超链接 |
| `getMediaPath(url, filepath, sourceType)` | 根据来源模块计算媒体相对路径（处理 `../` 层级） |
| `showLikeWin(dom, dataList)` | 弹出点赞列表 Modal |
| `showVisitorsWin(dom, dataList)` | 弹出最近访问 Modal |
| `showCommentsWin(dom, dataList)` | 弹出评论列表 Modal |
| `getCommentHtml(comments, tplContent?)` | 渲染评论 HTML |
| `getOldYearData(dataList, field)` | 计算"那年今日"数据（排除当年，按月日匹配） |
| `getImgClassType(message, isShare)` | 根据媒体数量返回 CSS 类名（`three`/`two`/空） |
| `renderPreviews(event)` / `renderPhotoPreviews(index, loadSize)` | lightGallery 缩略图懒加载替换 |
| `renderCommentBox(comments, tplContent)` | 在 lightGallery 中渲染评论侧栏 |
| `handleCommentBomEvent(event)` | 处理画廊切换时的评论渲染（按 `moduleName` 分派） |
| `registerEvents(gallery)` | 注册 lightGallery 的 `lgAfterOpen`/`lgBeforeSlide`/`lgAfterSlide` 事件 |
| `registerImageLoadedEvent()` | 为 `img.lazyload` 注册加载完成回调，移除 loading 样式 |
| `registerShowLikeWin(items)` | 绑定 `.viewlikes` 点击事件 |
| `registerShowVisitorsWin(items)` | 绑定 `.viewVisitors` 点击事件 |
| `registerShowCommentsWin(items)` | 绑定 `.viewcomments` 点击事件 |
| `registerReadMoreEvents()` | 绑定 `.readMore` 展开/收起全文 |

#### 4.1.3 业务模块 API（定义在 common.js 中）

| 命名空间 | 主要方法 | 说明 |
| --- | --- | --- |
| `API.Blogs` | `getEffectBit(e, t)`、`getBlogLabel(item)` | 解析日志 effect 位标识，返回标签数组（原创/置顶/转载/推荐等） |
| `API.Messages` | `getMapUrl(lbs)` | 根据 LBS 坐标生成腾讯地图标记链接 |
| `API.Photos` | `getPhotoType(photo)`、`getPhotoLbs(photo)` | 相片类型枚举（JPEG/GIF/PNG/BMP），获取拍摄地点 |
| `API.Favorites` | `getShareUrl(share_info)` | 收藏内容的目标 URL（相册/日志/音乐/视频） |
| `API.Shares` | `getDisplayType(innerType)` | 分享类型枚举（日志/相册/照片/网页/视频/商品/新闻/微博/音乐） |
| `API.Visitors` | `isHome(item)`、`getTitle(item)` | 判断是否访问主页，生成访问标题 |
| `API.Videos` | `isTencentVideo(video)`、`isExternalVideo(video)`、`getVideoUrl(video)`、`getTencentVideoUrl(vid)` | 视频类型判定与播放地址生成（腾讯视频走 `v.qq.com/txp/iframe`） |
| `API.Friends` | `getCommonFriend`、`getShowCommonFriend`、`getCommonGroup`、`getShowCommonGroup`、`getShowFriendTime`、`getShowFriendType`、`getShowAccessType`、`getShowCare`、`getShowIntimacyScore`、`getShowMessage` | 好友关系的各种展示值，支持纯文本与 HTML 两种 `showType` |

### 4.2 [Common/js/sidebar.js](file:///c:/Users/15572/Music/-2--main/Common/js/sidebar.js)

左侧浮动目录生成器：

- `initSidebar()`：扫描页面中 `h1~h6` 及 `.sidebar-h1~.sidebar-h6` 元素，为其生成唯一 ID，并在 `#BlogAnchor` 容器中构建可点击的目录链接。
- 自动处理外链 `target="_blank"`。
- 监听 `window.onhashchange` 与 `window.resize`，定位时扣除 58px 顶部导航高度。
- 通过 `$(document).ready(initSidebar)` 自动执行。

### 4.3 [Common/json/config.js](file:///c:/Users/15572/Music/-2--main/Common/json/config.js)

`window.QZone_Config` 全局配置对象，由导出工具生成，结构如下（节选）：

| 顶层键 | 子键示例 | 说明 |
| --- | --- | --- |
| `Common` | `downloadType`、`downloadThread`、`Aria2`、`refererUrls` | 通用下载/导出设置 |
| `Messages` | `pageSize`、`hasThatYearToday`、`FilterKeyWords`、`Like`、`Visitor`、`Comments` | 说说模块配置 |
| `Boards` | `pageSize`、`hasThatYearToday` | 留言板配置 |
| `Blogs` / `Diaries` | `pageSize`、`showType`、`Comments`、`Like`、`Visitor` | 日志/日记配置 |
| `Photos` | `Images`、`RenameType`、`SortType`、`exifType` | 相册配置 |
| `Videos` | `pageSize`、`RenameType` | 视频配置 |
| `Shares` | `pageSize`、`SourceType`（含 60+ 来源正则） | 分享配置 |
| `Favorites` / `Friends` / `Visitors` / `Statistics` | 各自配置 | 其他模块 |

> 在本备份站点中，该配置主要用于业务 JS 判断（如 `QZone_Config.Messages.hasThatYearToday`、`QZone_Config.Blogs.showType`）。

### 4.4 [Common/json/user.js](file:///c:/Users/15572/Music/-2--main/Common/json/user.js)

`window.userInfo` 对象，存储空间主人的档案：

```
uin=1601913793, name="实验+梅园初級中學校園墻"
messages=715, boards=45, visitors=136538
blogs/diaries/photos/videos/favorites/shares/friends=0
avatar=https://qlogo1.store.qq.com/qzone/1601913793/1601913793/100
birthday=04-04, birthyear=2000, age=22
```

### 4.5 [Common/css/common.css](file:///c:/Users/15572/Music/-2--main/Common/css/common.css)

全局样式表，主要包含：

- 自定义滚动条样式（`::-webkit-scrollbar*`）
- 导航栏、面包屑、首页头部、列表组圆角
- 首页背景图 `.export-tips`（引用 `../images/index.jpg`）
- 说说、留言、评论、相册、视频等业务元素的布局样式
- lightGallery 评论侧栏样式
- 左侧目录 `#BlogAnchor` 浮动样式

---

## 5. 业务功能模块

每个业务模块遵循统一约定：

| 文件 | 作用 |
| --- | --- |
| `index.html` | 页面骨架，引入 CDN、公共脚本、模块脚本 |
| `<YEAR>.html` | 按年份分页的预渲染副本（如 `2019.html`） |
| `js/<module>.js` | 模块初始化逻辑，通常在 `$(function(){...})` 中执行 |
| `json/<module>.js` | `window.<var> = <data>` 形式的备份数据 |
| `images/` | 模块相关媒体资源 |

### 5.1 Messages 说说模块

- **入口**：[Messages/index.html](file:///c:/Users/15572/Music/-2--main/Messages/index.html)
- **脚本**：[Messages/js/messages.js](file:///c:/Users/15572/Music/-2--main/Messages/js/messages.js)
- **数据**：`window.messages = [...]`，单条说说结构包含 `tid`、`uin`、`name`、`created_time`、`conlist`、`custom_images`、`custom_videos`、`custom_magics`、`custom_audios`、`custom_voices`、`commentlist`、`likes`、`custom_visitor` 等。

**初始化流程**：
1. 若 `QZone_Config.Messages.hasThatYearToday` 为真，调用 `API.Common.getOldYearData(messages, "created_time")` 计算那年今日，用 `TPL.MESSAGES_YEAR_ITEMS` 渲染并插入到 `#messages_html` 顶部。
2. 重新生成左侧目录 `initSidebar()`。
3. 启用图片懒加载 `lazyload()`。
4. 为 `.message-lightbox` 绑定点击事件，实例化 lightGallery（含 zoom/autoplay/comment/fullscreen/rotate/thumbnail/video 插件），并设置 `moduleName='Messages'` 以便评论侧栏按说说 ID 查找。
5. 为 `.comment-img-lightbox` 绑定评论图片画廊。
6. 注册点赞、访客、查看全文、图片加载完成事件。
7. 初始化所有 Tooltip。

### 5.2 Boards 留言板模块

- **入口**：[Boards/index.html](file:///c:/Users/15572/Music/-2--main/Boards/index.html)
- **脚本**：[Boards/js/boards.js](file:///c:/Users/15572/Music/-2--main/Boards/js/boards.js)
- **数据**：`window.boardInfo = {items:[...], authorInfo, total}`，单条留言包含 `id`、`uin`、`nickname`、`pubtime`、`htmlContent`、`ubbContent`、`replyList`。

**初始化流程**：
1. 计算"那年今日"（字段 `pubtime`），用 `TPL.BOARDS_YEAR_ITEMS` 渲染并插入到 `.boards-items` 之前。
2. `initSidebar()` + `lazyload()`。
3. 为 `.messageText img` 绑定 lightGallery（仅图片，不含视频/评论）。
4. 初始化 Tooltip。

### 5.3 Blogs 日志模块

- **入口**：[Blogs/index.html](file:///c:/Users/15572/Music/-2--main/Blogs/index.html)（列表）、[Blogs/info.html](file:///c:/Users/15572/Music/-2--main/Blogs/info.html)（详情）
- **脚本**：[Blogs/js/blogs.js](file:///c:/Users/15572/Music/-2--main/Blogs/js/blogs.js)、[Blogs/js/bloginfo.js](file:///c:/Users/15572/Music/-2--main/Blogs/js/bloginfo.js)
- **数据**：`window.blogs = []`（当前备份为空）

**列表页**（`blogs.js`）提供两种视图：
- `API.Blogs.showList()`：基于 `TPL.BLOGS_TYPE_LIST` 渲染分类 Tab + 列表。
- `API.Blogs.showTableList()`：基于 `API.Utils.initTable` 渲染 Bootstrap Table。
- 通过 `QZone_Config.Blogs.showType`（`'0'` 表格 / 其他 HTML）切换。

**详情页**（`bloginfo.js`）：
1. 从 URL 读取 `blogId`，在 `blogs` 中按 `blogid` 查找。
2. 渲染标题、时间，将 `blog.custom_html`（Base64）解码后注入 `#blog_content`。
3. 渲染评论模板。
4. 为正文图片绑定 lightGallery。
5. 注册点赞、访客窗口。

### 5.4 Diaries 私密日记模块

- **脚本**：[Diaries/js/diaries.js](file:///c:/Users/15572/Music/-2--main/Diaries/js/diaries.js)、[Diaries/js/diaryinfo.js](file:///c:/Users/15572/Music/-2--main/Diaries/js/diaryinfo.js)
- **数据**：`window.diaries`

逻辑与 Blogs 几乎一致：`showList` 复用 `TPL.BLOGS_TYPE_LIST`，`showTableList` 初始化 `diaries-table`，详情页 `diaryinfo.js` 与 `bloginfo.js` 仅变量名不同。

### 5.5 Albums 相册模块

- **脚本**：[Albums/js/albums.js](file:///c:/Users/15572/Music/-2--main/Albums/js/albums.js)（相册列表）、[Albums/js/photos.js](file:///c:/Users/15572/Music/-2--main/Albums/js/photos.js)（单相册照片）
- **数据**：`window.albums`（当前备份为空）

**`albums.js`**：仅注册评论、访客、点赞三个 Modal 触发器与 Tooltip。

**`photos.js`**：
1. 读取 `albumId`（URL 参数或模板预置）。
2. 在 `albums` 中按 `id` 查找，赋值给 `window.album`。
3. 用 `#photos_tpl` 模板渲染相片列表到 `#lightgallery`。
4. 实例化 lightGallery（含 hash、video、comment 插件），设置 `moduleName='Albums'`。
5. 注册赞、评论、图片加载事件。

### 5.6 Videos 视频模块

- **入口**：[Videos/index.html](file:///c:/Users/15572/Music/-2--main/Videos/index.html)
- **脚本**：[Videos/js/videos.js](file:///c:/Users/15572/Music/-2--main/Videos/js/videos.js)
- **数据**：`window.videos = []`

**初始化流程**：
1. 读取页面内 `window.targetYear`（`"ALL"` 或具体年份），按 `uploadtime` 过滤。
2. `lazyload()`。
3. 实例化 lightGallery（含 hash、video、comment、thumbnail 插件），`moduleName='Videos'`。
4. 注册赞、评论、图片加载、Tooltip。

> `index.html` 通过内联 `<script>` 设置 `window.targetYear = "ALL"`，年份页面（如 `2020.html`）会设置为对应年份。

### 5.7 Shares 分享模块

- **入口**：[Shares/index.html](file:///c:/Users/15572/Music/-2--main/Shares/index.html)
- **脚本**：[Shares/js/shares.js](file:///c:/Users/15572/Music/-2--main/Shares/js/shares.js)
- **数据**：`window.shares = []`

结构与 Messages 几乎相同：那年今日（字段 `shareTime`，模板 `TPL.SHARES_YEAR_ITEMS`）、lightGallery 实例化（`moduleName='Shares'`）、评论图片画廊、点赞、访客、图片加载事件。

### 5.8 Favorites 收藏夹模块

- **脚本**：[Favorites/js/favorites.js](file:///c:/Users/15572/Music/-2--main/Favorites/js/favorites.js)

仅含 lightGallery 实例化（不含评论、视频插件）与图片加载、Tooltip 初始化。`moduleName='Favorites'`。

### 5.9 Friends 好友模块

- **脚本**：[Friends/js/friends.js](file:///c:/Users/15572/Music/-2--main/Friends/js/friends.js)
- **数据**：`window.friends`（当前备份为空）

**特性**：
1. 引入 `moment.js` 并设置 `zh-CN` 语言环境（用于"相识 X 年"的相对时间显示）。
2. **`showList`**：在 `groupBy groupName` 基础上额外构造三个虚拟分组：
   - 特别关心（`fa-heartbeat`）
   - 无权访问（`fa-lock`）
   - 单向好友（`fa-user-times`）
3. 用 `TPL.FRIENDS_GROUP_LIST` 渲染 Tab + 列表。
4. **`showTableList`**：13 列 Bootstrap Table（头像、QQ、昵称、备注、分组、QQ 通讯、特别关心、访问权限、好友关系、相识时间、亲密度、共同好友、共同群组）。
5. 通过 `QZone_Config.Friends.showType` 切换视图。

### 5.10 Visitors 访客模块

- **入口**：[Visitors/index.html](file:///c:/Users/15572/Music/-2--main/Visitors/index.html)
- **脚本**：[Visitors/js/visitors.js](file:///c:/Users/15572/Music/-2--main/Visitors/js/visitors.js)（**空文件**）
- **数据**：`window.visitorInfo = {items:[], total:136538, totalPage:1}`

由于隐私限制，访客列表无明细，仅显示总数。页面只有空骨架。

### 5.11 Statistics 统计模块

- **脚本**：[Statistics/js/statistics.js](file:///c:/Users/15572/Music/-2--main/Statistics/js/statistics.js)

**未完成**：仅有一行 `API.Statistics.getAllLbs() = function() {}`，且语法非法（不能给函数调用结果赋值），实际不会执行。

### 5.12 首页 index.html

- **入口**：[index.html](file:///c:/Users/15572/Music/-2--main/index.html)
- **功能**：
  - 顶部加载和风天气插件（`widget.qweather.net`，城市 `CN101200803`）。
  - 顶部导航指向 GitHub 仓库 `wyxshisb`。
  - 列出所有模块入口及条数徽章（说说 715、留言 45、访客 136538 等）。
  - 底部固定 footer 提示"手机端没优化好，建议使用 PC 端"。
  - 注入百度统计 `hm.js`。

---

## 6. 数据层（json/*.js）

所有数据文件均以 `window.<varName> = <value>` 形式定义，便于 HTML 直接通过 `<script src>` 加载。

| 文件 | 全局变量 | 数据结构 |
| --- | --- | --- |
| `Common/json/config.js` | `window.QZone_Config` | 配置对象（见 4.3） |
| `Common/json/user.js` | `window.userInfo` | 用户档案对象（见 4.4） |
| `Messages/json/messages.js` | `window.messages` | 数组 `[{tid, uin, name, created_time, conlist, custom_images, custom_videos, custom_magics, custom_audios, custom_voices, commentlist, likes, custom_visitor, ...}]` |
| `Boards/json/boards.js` | `window.boardInfo` | `{items:[{id, uin, nickname, pubtime, htmlContent, ubbContent, replyList, secret, ...}], authorInfo, total}` |
| `Blogs/json/blogs.js` | `window.blogs` | 数组 `[{blogid, title, pubtime, category, effect, custom_html, custom_title, replynum, custom_visitor, ...}]` |
| `Diaries/json/diaries.js` | `window.diaries` | 结构同 blogs |
| `Videos/json/videos.js` | `window.videos` | 数组 `[{uploadtime, url3, video_id, custom_filepath, comments, ...}]` |
| `Shares/json/shares.js` | `window.shares` | 数组 `[{id, uin, nickname, shareTime, type, desc, source, comments, ...}]` |
| `Visitors/json/visitors.js` | `window.visitorInfo` | `{items:[], total, totalPage}` |
| `Friends/json/friends.js` | `window.friends` | 数组 `[{uin, name, remark, groupName, isFriend, access, care, addFriendTime, intimacyScore, common, ...}]` |
| `Albums/json/albums.js` | `window.albums` | 数组 `[{id, name, photoList, ...}]` |
| `Favorites/json/favorites.js` | `window.favorites` | 数组（结构未在脚本中体现） |

> 字段中带 `custom_` 前缀的多为导出工具加工后的字段（如 `custom_html` 是 Base64 编码的日志正文、`custom_filepath` 是本地化的媒体路径、`custom_create_time` 是格式化后的时间字符串）。

---

## 7. 模板系统（TPL）

`TPL` 全局对象定义在 [Common/js/common.js](file:///c:/Users/15572/Music/-2--main/Common/js/common.js) 中（约 1738 行起），使用 `template_js` 语法（`<% ... %>`、`<%:= ... %>`、`<% ... %>` 控制流）。

### 7.1 通用模板

| 模板常量 | 用途 |
| --- | --- |
| `TPL.MODAL_WIN` | 通用 Modal 弹窗外壳（id/size/title/body） |
| `TPL.LIKE_LIST` | 点赞列表（带头像、性别、星座、地址） |
| `TPL.VISITOR_LIST` | 最近访问列表（带头像与时间） |
| `TPL.COMMON_COMMENT` | 单条评论（含回复树、评论图片画廊） |
| `TPL.COMMON_COMMENTS` | 评论列表（循环 `COMMON_COMMENT`） |

### 7.2 说说模板

| 模板常量 | 用途 |
| --- | --- |
| `TPL.MESSAGES_COMMENTS` | 说说评论（循环 `COMMON_COMMENT`） |
| `TPL.MESSAGES_ITEM` | 单条说说卡片（头像、内容、语音、转发、大图详情、视频/图片/动画表情/音乐多媒体、评论、点赞访客 footer） |
| `TPL.MESSAGES_YEAR_ITEMS` | 那年今日说说列表（按年份分组） |

### 7.3 留言板模板

| 模板常量 | 用途 |
| --- | --- |
| `TPL.BOARDS_ITEM` | 单条留言卡片（含回复列表） |
| `TPL.BOARDS_YEAR_ITEMS` | 那年今日留言列表 |

### 7.4 分享模板

| 模板常量 | 用途 |
| --- | --- |
| `TPL.SHARES_COMMENTS` | 分享评论 |
| `TPL.SHARES_ITEM` | 单条分享卡片（含分享源 blockquote、来源、评论） |
| `TPL.SHARES_YEAR_ITEMS` | 那年今日分享列表 |

### 7.5 日志模板

| 模板常量 | 用途 |
| --- | --- |
| `TPL.BLOGS_LIST_ITEM` | 单条日志列表项（标签、缩略图、摘要、元数据） |
| `TPL.BLOGS_LIST` | 全部日志列表 |
| `TPL.BLOGS_LIST_TYPE` | 分类日志列表 |
| `TPL.BLOGS_TYPE_LIST` | 日志分类 Tab + 列表容器 |

### 7.6 好友模板

| 模板常量 | 用途 |
| --- | --- |
| `TPL.FRIENDS_LIST_ITEM` | 单个好友卡片（头像、QQ、备注、四个状态徽章、四个关系徽章） |
| `TPL.FRIENDS_LIST` | 全部好友列表 |
| `TPL.FRIENDS_LIST_GROUP` | 分组好友列表 |
| `TPL.FRIENDS_GROUP_LIST` | 好友分组 Tab + 列表容器 |

### 7.7 模板复用关系

```
TPL.COMMON_COMMENTS ─┬─ TPL.COMMON_COMMENT
TPL.MESSAGES_COMMENTS┴─ TPL.COMMON_COMMENT
TPL.MESSAGES_YEAR_ITEMS ─ TPL.MESSAGES_ITEM ─ TPL.MESSAGES_COMMENTS
TPL.BOARDS_YEAR_ITEMS  ─ TPL.BOARDS_ITEM
TPL.SHARES_YEAR_ITEMS  ─ TPL.SHARES_ITEM ─ TPL.SHARES_COMMENTS ─ TPL.COMMON_COMMENT
TPL.BLOGS_TYPE_LIST    ─ TPL.BLOGS_LIST ─ TPL.BLOGS_LIST_ITEM
TPL.FRIENDS_GROUP_LIST ─ TPL.FRIENDS_LIST ─ TPL.FRIENDS_LIST_ITEM
```

---

## 8. 依赖关系

### 8.1 CDN 依赖

| 库 | 版本 | CDN | 用途 |
| --- | --- | --- | --- |
| jQuery | 3.6.0 | `cdn.staticfile.org` | DOM 操作、事件、AJAX |
| Bootstrap | 4.6.1 | `cdn.staticfile.org` | 栅格、组件、Modal、Tooltip |
| jQuery Mousewheel | 3.1.13 | `cdn.staticfile.org` | 滚轮事件 |
| lodash | 4.17.21 | `cdn.staticfile.org` | 工具函数 |
| Font Awesome | 4.7.0 | `cdn.staticfile.org` | 图标 |
| lightGallery Core | 2.3.0 | `cdn.staticfile.org` | 图片/视频画廊 |
| lg-zoom / lg-video / lg-thumbnail / lg-rotate / lg-fullscreen / lg-comment / lg-autoplay / lg-hash | 2.3.0 | `cdn.staticfile.org` | lightGallery 插件 |
| jquery_lazyload | 2.0.0-rc.2 | `cdn.staticfile.org` | 图片懒加载 |
| template_js | 2.2.1 | `fastly.jsdelivr.net` | 模板引擎（`<% %>` 语法） |
| moment.js | — | （friends.js 引用） | 相对时间显示 |
| Bootstrap Table | — | （`API.Utils.initTable` 调用） | 表格视图（脚本未显式引入，疑由调用方页面补充） |

### 8.2 第三方服务

| 服务 | 域名 | 用途 |
| --- | --- | --- |
| 和风天气插件 | `widget.qweather.net` | 首页顶部天气卡片 |
| 百度统计 | `hm.baidu.com` | 首页访问统计 |
| 点击爱心 | `www.lvshuncai.com/custom/js/clicklove.min.js` | 页面点击出现爱心动效 |
| QQ 头像 | `qlogo{0-4}.store.qq.com` | 用户头像 |
| QQ 空间 | `user.qzone.qq.com` | 用户主页链接 |
| QQ 表情 | `qzonestyle.gtimg.cn/qzone/em/` | QQ 经典表情 GIF |
| 微信表情 | `fastly.jsdelivr.net/gh/ShunCai/QZoneExport@dev/src/img/emoji` | 微信新表情 PNG |
| 腾讯地图 | `apis.map.qq.com` | LBS 位置标记 |
| 腾讯视频 | `v.qq.com/txp/iframe/player.html` | 腾讯视频嵌入播放 |

### 8.3 模块间依赖

- 所有业务模块均依赖 `Common/js/common.js`（提供 `API`、`TPL`、`parseEmoji`、`emojis`）。
- 含目录的页面依赖 `Common/js/sidebar.js`。
- 含评论/那年今日的页面依赖 `Common/json/config.js`（读取 `QZone_Config`）。
- 详情类页面（`Blogs/info.html`、`Diaries/info.html`）依赖列表数据文件（`blogs.js` / `diaries.js`）。
- `Blogs/info.html` 复用 `Blogs/js/bloginfo.js` 与 `Blogs/json/blogs.js`；`Diaries` 同理。

---

## 9. 运行方式

### 9.1 直接打开

由于所有资源均为静态文件，**双击根目录 `index.html`** 即可在浏览器中查看。

> 注意：部分浏览器对 `file://` 协议下的脚本加载有 CORS 限制，可能导致某些页面无法正常加载脚本。推荐使用静态服务器方式。

### 9.2 使用静态服务器（推荐）

在项目根目录启动任意静态服务器：

```bash
# Python 3
python -m http.server 8000

# Node.js (http-server)
npx http-server -p 8000

# VS Code Live Server 插件
# 右键 index.html → Open with Live Server
```

然后访问 `http://localhost:8000/`。

### 9.3 通过 GitHub Pages 访问

仓库 `docs/` 目录已配置 Jekyll 主题 `jekyll-theme-cayman`，开启 GitHub Pages 后会展示 `docs/index.md` 的内容（默认欢迎页，与主站点无关）。要访问完整备份站点，需将 Pages 的源设置为 `main` 分支根目录。

### 9.4 模块入口速查

| 模块 | URL（相对于根） |
| --- | --- |
| 个人中心 | `index.html` |
| 说说 | `Messages/index.html` |
| 说说（按年） | `Messages/2022.html` 等 |
| 留言板 | `Boards/index.html` |
| 日志列表 | `Blogs/index.html` |
| 日志详情 | `Blogs/info.html?blogId=<blogid>` |
| 私密日记列表 | `Diaries/index.html` |
| 私密日记详情 | `Diaries/info.html?blogId=<blogid>` |
| 相册 | `Albums/index.html` |
| 单相册照片 | `Albums/photos.html?albumId=<id>` |
| 视频 | `Videos/index.html` |
| 分享 | `Shares/index.html` |
| 收藏夹 | `Favorites/index.html` |
| 好友 | `Friends/index.html` |
| 访客 | `Visitors/index.html` |

---

## 10. 关键流程

### 10.1 说说页面加载流程

```
浏览器加载 Messages/index.html
  ├─ <head> 引入 jQuery / Bootstrap / lightGallery(含插件) / lazyload / template.js
  ├─ <head> 引入 ../Common/json/config.js     → window.QZone_Config
  ├─ <head> 引入 json/messages.js              → window.messages = [...]
  ├─ <head> 引入 ../Common/js/common.js        → window.API / window.TPL / emojis
  ├─ <head> 引入 ../Common/js/sidebar.js       → initSidebar()
  └─ <head> 引入 js/messages.js                → $(function(){...}) 入口
        ├─ getOldYearData(messages, "created_time") → 计算那年今日 Map
        ├─ template(TPL.MESSAGES_YEAR_ITEMS, {yearMaps}) → 渲染那年今日 HTML
        ├─ $('#messages_html').prepend(items_html)
        ├─ initSidebar()                       → 重建左侧目录
        ├─ lazyload()                          → 启用图片懒加载
        ├─ $('.message-lightbox').on('click', ...) → 实例化 lightGallery + 注册事件
        ├─ $('.comment-img-lightbox').on('click', ...) → 评论图片画廊
        ├─ registerShowVisitorsWin(messages)
        ├─ registerShowLikeWin(messages)
        ├─ registerReadMoreEvents()
        ├─ registerImageLoadedEvent()
        └─ $('[data-toggle="tooltip"]').tooltip()
```

### 10.2 lightGallery 评论侧栏渲染流程

```
用户点击画廊中的图片
  └─ lightGallery 触发 lgAfterSlide 事件
     └─ API.Common.handleCommentBomEvent(event)
        ├─ 读取 event.target.moduleName
        ├─ switch(moduleName)
        │   ├─ 'Albums'   → album.photoList[idx].comments
        │   ├─ 'Videos'   → videos[idx].comments
        │   ├─ 'Messages' → messages[messageIdx].commentlist
        │   ├─ 'Shares'   → shares[shareIdx].comments
        │   └─ default    → []
        └─ renderCommentBox(comments, TPL.COMMON_COMMENTS)
           ├─ 渲染评论 HTML
           └─ 注入到 .lg-comment-body
```

### 10.3 "那年今日"计算流程

```
API.Common.getOldYearData(dataList, field)
  ├─ groupedByTime(dataList, field, 'all') → Map<year, Map<month, items[]>>
  ├─ 删除当年数据
  ├─ 遍历每条记录，比较 "-MM-dd" 是否等于今天
  ├─ 收集命中记录到新 Map<year, items[]>
  └─ 返回新 Map（仅含历史同月同日数据）
```

### 10.4 日志详情渲染流程

```
用户访问 Blogs/info.html?blogId=123
  └─ bloginfo.js $(function(){...})
     ├─ getUrlParam('blogId') → 123
     ├─ blogs.getIndex(123, 'blogid') → 定位 blog 对象
     ├─ document.title = 'QQ空间备份-' + blog.custom_title
     ├─ $('#blog_title').text(...)
     ├─ $('#blog_time').text(formatDate(blog.pubtime))
     ├─ base64ToUtf8(blog.custom_html) → 解码日志正文 HTML
     ├─ $('#blog_content').html(...)
     ├─ template(comments_tpl, {blog}) → 渲染评论
     ├─ $('#blog_content img').on('click', ...) → lightGallery
     ├─ registerShowVisitorsWin(blogs)
     └─ registerShowLikeWin(blogs)
```

### 10.5 内容格式化流水线

`API.Common.formatContent(item, type, isRt, isSupportedHtml, isEscHTML)` 是所有文本展示的核心入口：

```
原始内容 (string 或 {conlist})
  ├─ escHTML               → 转义 < > & "
  ├─ formatTopic           → #话题# → 链接
  ├─ formatEmoticon        → [em]eXXX[/em] → QQ 表情 <img>
  ├─ formatMention         → @{uin,nick} → 用户链接
  ├─ formatWxEmoji         → [微信表情] → 微信表情 <img>
  └─ (可选) escHTML        → 二次转义
```

---

## 附录：项目元数据

| 字段 | 值 |
| --- | --- |
| 仓库根目录 | `c:\Users\15572\Music\-2--main` |
| GitHub 仓库 | `wyxshisb/QQ-_1601913793` |
| 上游工具仓库 | `ShunCai/QZoneExport` |
| 备份 QQ 号 | `1601913793` |
| 备份昵称 | 实验+梅园初級中學校園墻 |
| 空间名称 | 實驗初級中學校園墻的空间 |
| 备份生成时间范围 | 2019–2022 |
| 说说数 | 715 |
| 留言数 | 45 |
| 访客总数 | 136538（无明细） |
| 其他模块 | 0 条 |

---

*本文档由代码静态分析生成，如项目代码更新，请同步修订。*
