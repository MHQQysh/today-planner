# 今日 · 时间规划

中文个人日历。左侧 Tasks 是不绑定日期或时间的待办清单；右侧为时间网格，点击或用鼠标拖选时间段添加规划。电脑默认周视图，可切换单日；手机默认单日。支持分类、备注、完成打勾、日期切换、JSON 导出。本机模式可直接使用；配置 Supabase 后使用 GitHub 登录，跨设备读取同一份计划和任务。

点击已有时间块可修改、完成或删除；左侧任务支持直接新增、修改名称、打勾和删除。时间块按真实时长显示，重叠规划并排展示。日历初始滚动到 07:00，可上下滚动查看全天。跨午夜的规划需分为两天填写。

已使用旧版数据库时，请再次执行最新版 `supabase.sql`，它会保留已有计划并新增 `tasks` 表及权限。导入和导出现在同时包含时间规划与任务。

## 本地运行

安装 Node.js 22，然后在项目目录执行：

```sh
npm install
npm run dev
```

打开终端提供的网址。验证：`npm test`，构建：`npm run build`。不要直接双击 HTML，模块需要通过网站服务器打开。

## 免费发布到 GitHub Pages

1. 在 GitHub 新建一个公开仓库，例如 `today-planner`，上传项目文件（不要上传 node_modules、dist 或私密凭据），默认分支用 `main`。
2. 在仓库 Settings → Pages → Build and deployment 中，Source 选择 **GitHub Actions**。
3. 提交后 Actions 自动构建发布。地址通常为 `https://你的用户名.github.io/today-planner/`。
4. 如需让两端自动使用同一个云项目，在 Settings → Secrets and variables → Actions → Variables 添加 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY`，然后重新运行发布。后者填 Publishable key 或 anon 公钥。它们会包含在网页中，不能使用 Secret 或 service_role key。

## 连接 Supabase

1. 创建 **Free** 项目，进入 SQL Editor 执行本项目的 `supabase.sql`。该文件开启 RLS：登录用户仅可读写自己的记录。
2. 取得项目 URL 和 Publishable key，配置为上面的 GitHub Variables；也可在网页的“同步与设置”里填写（这种方式需在每台设备填写一次）。
3. 在 GitHub Settings → Developer settings → OAuth Apps 新建应用。Homepage URL 填网站地址；Authorization callback URL 填 `https://项目编号.supabase.co/auth/v1/callback`。
4. 在 Supabase Authentication → Sign In / Providers → GitHub 启用登录，将 OAuth 应用的 Client ID 和 Client Secret 填入 **Supabase 控制台**。不要把 Client Secret 提交到代码或网页。
5. Supabase Authentication → URL Configuration：Site URL 填网站完整地址，Redirect URLs 添加同样地址，包括仓库路径和末尾 `/`。本地测试另加 `http://127.0.0.1:5173/`。
6. 两台设备打开网站，使用同一 GitHub 账号登录。每 15 秒及返回窗口时刷新，写入完成后立即刷新当前设备。

官方参考：[GitHub 登录](https://supabase.com/docs/guides/auth/social-login/auth-github)、[行级权限](https://supabase.com/docs/guides/database/postgres/row-level-security)。

## 保存行为

- 未登录：仅保存在当前浏览器 localStorage，清除网站数据会删除本机计划。建议定期导出。
- 登录后：显示云端记录；本机记录仍保留，可通过“将本机计划导入云端”显式导入。重复编号保留云端版本。
- 云端写入失败不会提示成功；编辑表单保留内容供重试。离线不支持云端写入排队。
- 编辑或删除时检查记录版本；若另一设备已改动，提示刷新后重试，避免静默覆盖。
- 可以安排重叠时间，但保存前提醒；总时长为各事项时长之和，重叠部分重复计算。
- Supabase 免费项目可能在一周不活跃后暂停，需到控制台恢复。当前项目未购买任何服务。

## 云端上线前验证

在真实项目中验证账号 A 写入、另一设备同账号读取；账号 B 看不到 A 的计划；修改时另一设备出现冲突提示；退出后回到本机数据。尚未配置真实项目时，这些检查无法替代为本地测试。
