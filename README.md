# 今日 · 计划清单

网站：https://shihongyuan.cn/today-planner/

上半部分为按日期保存的今日规划，逐条添加、编辑、完成和删除。下半部分为可左右滑动的长期规划卡片，可以自定义月规划、论文规划等，每张卡片独立维护步骤。手机电脑使用同一份云端数据，无需登录，所有访问者都可以编辑。

## 使用

- 今日规划使用左右日期按钮回看历史，不会在第二天删除昨天的记录。
- 点击“新建规划”添加卡片；卡片右上角“···”可修改名称、颜色或删除整个规划。
- 手机左右滑动卡片，电脑可使用左右箭头。
- 设置里可以立即同步或导出全部清单。正常情况下每 15 秒和返回窗口时同步。
- 本机预览地址加 `?preview=1`，仅写入当前标签页的临时存储，不与云端共享。

## 数据库

首次执行 `supabase-checklists.sql`，建立 planning_boards 和 checklist_items，并从历史 shared_plans/shared_tasks 迁入已有记录，保留旧表。此迁移已经在当前线上项目执行成功，请勿反复执行，以免已删除的历史记录再次导入。

共享权限由 RLS 明确授予匿名访问者；不要将隐私内容放入此公开共享看板。修改使用记录版本检查，避免静默覆盖另一设备的修改。

## 开发与验证

```sh
npm install
npm run dev
npm test
npm run build
node tests/checklists-browser.mjs
```

浏览器测试使用本机 Microsoft Edge。旧日历模块及相关测试保留供历史参考，当前入口为 src/checklists.js。

## 发布

推送 main 自动触发 GitHub Pages 工作流。公开连接配置在 src/public-config.js；可用 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY 构建变量覆盖。只使用 Publishable key / anon 公钥，不放管理员密钥。
