# 今日 · 公开共享日历

左侧 Tasks 不需要日期或时间；右侧可以点击或拖选时间段添加规划。电脑默认周视图，手机默认单日。

## 当前模式

无需登录。所有访问者共同查看、添加、修改和删除同一份时间规划及 Tasks。请只放愿意公开的内容。

共享表为 `shared_plans`、`shared_tasks`，不使用账号身份。旧版私人 `plans`、`tasks` 表保持原样，不自动公开。原有本机记录可在设置中点击“将本机内容公开到共享看板”导入。

## 配置云端

1. Supabase SQL Editor 中执行 `supabase-shared.sql`。这会创建共享表，并通过 RLS 明确允许匿名访问者读写共享表。
2. 网页构建时提供 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY`（Publishable key / anon 公钥），或在网页设置中填写。不要使用 Secret / service_role key。
3. 不需要 GitHub OAuth、Client Secret、登录或登录返回地址。
4. 两台设备打开同一个发布后的网址，就会读取相同共享表。每 15 秒及窗口重新聚焦时刷新。

## 本地预览与验证

安装 Node.js 22 或更新版本后运行：

```sh
npm install
npm run dev
npm test
npm run build
```

浏览器测试使用本机 Edge：`node tests/browser.mjs` 验证本机模式；`node tests/shared-browser.mjs` 通过模拟云端验证两个独立浏览器的匿名共享读写、删除和写入失败。

## GitHub Pages 发布

1. 创建公开仓库并上传项目文件，默认分支为 main。不要上传 node_modules、dist、.env.local 或私密密钥。
2. Settings → Pages 中 Source 选择 GitHub Actions。
3. Settings → Secrets and variables → Actions → Variables 添加上述两个 VITE 变量，仅使用公开密钥。
4. 推送 main 后发布工作流自动测试、构建与发布，网站地址见 Actions 或 Settings → Pages。

## 保存与限制

- 没有云端配置时使用本机存储；清除浏览器数据会删除本机记录，建议导出备份。
- 已配置云端但权限、建表或网络有问题时会明确报错，不会静默切换本机并假装同步。
- 写入失败保留编辑草稿；离线不提供云端写入排队。
- 编辑及删除检查记录版本，避免覆盖另一台设备已做的修改。
- 导入同编号记录时保留云端版本。导出包含所有共享规划与任务。
- Supabase 免费项目可能因一周不活跃暂停，需去控制台恢复。
- `supabase.sql` 为历史私人模式脚本；当前使用 `supabase-shared.sql`。
