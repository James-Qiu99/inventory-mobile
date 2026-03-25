# 库存管理小工具（手机网页版）

这是一个适合手机和电脑通过浏览器打开的库存管理网页，现已改造成 **GitHub Pages + Supabase(PostgreSQL)** 的云端同步版本。

## 功能

- 商品录入 / 编辑 / 删除
- 登记卖出
- 日 / 月统计
- 低库存提醒
- 备份 JSON
- 恢复 JSON 到云端
- 多设备同步使用
- 导出 CSV

## 技术架构

- 前端：纯静态网页（HTML + JS）
- 部署：GitHub Pages
- 云数据库：Supabase PostgreSQL
- 通信方式：前端通过 Supabase JS 直接读写数据库

## 文件说明

- `index.html`：页面结构和样式
- `app.js`：业务逻辑、Supabase 数据读写
- `supabase-config.example.js`：Supabase 配置模板
- `supabase.sql`：数据库建表 SQL

## 第一步：创建 Supabase 项目

1. 打开 Supabase
2. 新建一个项目
3. 进入 `SQL Editor`
4. 执行仓库里的 `supabase.sql`

这会创建两张表：

- `items`
- `sales`

并启用一个最简单的公开读写策略，方便当前静态网页直接访问。

> 注意：这是为了快速上线而设置的开放策略。后续如果你需要账号登录和权限隔离，我可以再帮你收紧权限。

## 第二步：配置前端连接 Supabase

复制一份配置文件：

```bash
cp supabase-config.example.js supabase-config.js
```

把里面内容替换成你自己的项目信息：

```js
window.SUPABASE_URL = 'https://你的项目地址.supabase.co';
window.SUPABASE_ANON_KEY = '你的 anon key';
```

这些值可以在 Supabase 项目的 `Settings -> API` 中找到。

## 第三步：本地测试

你可以直接开一个静态服务器：

```bash
python3 -m http.server 8080
```

然后访问：

```txt
http://localhost:8080
```

如果配置没问题，页面会显示已连接 Supabase，并能正常新增/修改库存。

## 第四步：发布到 GitHub Pages

### 方法一：直接用仓库根目录发布

如果仓库已经开启 GitHub Pages：

- Source 选择 `Deploy from a branch`
- Branch 选择 `main`
- Folder 选择 `/ (root)`

### 方法二：Actions 自动发布

也可以后续加 GitHub Actions 自动部署。

## 重要提醒

### 1. `supabase-config.js` 不建议直接提交公开仓库
虽然 `anon key` 不算管理员密钥，但如果你当前策略是开放读写，公开后任何人都可能改你的库存数据。

更稳妥的方法：

- 先做私有仓库使用
- 或后续加登录认证 + 更严格的 RLS
- 或改成用 Netlify / Vercel 注入环境变量构建

### 2. 当前是“快速可用版”
为了尽快实现前后端联动，这个版本采用：

- 前端直连数据库
- anon + RLS 开放策略

适合你现在先把业务跑起来。

如果你要上线给多人用，下一步建议升级成：

- Supabase Auth 登录
- 每个用户只看自己的数据
- 更细的权限控制

## 后续可继续升级

我还可以继续帮你加：

- 登录注册
- 每个用户独立库存
- 图片上传
- 分类统计图表
- 补货提醒
- 销售排行榜
- 操作日志
- 导入 Excel

## 当前迁移说明

你原来这个项目的数据保存在 `localStorage`。现在已经改成云端模式：

- 页面加载时从 Supabase 拉数据
- 新增/编辑/删除商品时直接写入云端
- 登记卖出时同步更新商品库存和销售记录
- 备份/恢复 JSON 仍然保留，但恢复目标改为云端数据库

如果你愿意，我下一步可以继续帮你：

1. 整理并提交这套代码到 git
2. 增加一个“从旧 localStorage 一键迁移到 Supabase”的按钮
3. 加上登录功能，避免任何人都能改数据
