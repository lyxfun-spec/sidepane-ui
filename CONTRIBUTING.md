# 为 SidePane UI 做贡献

感谢你愿意改进 SidePane UI。提交改动前，请先搜索已有的 Issue 和 Pull Request，避免重复工作。

## 本地开发

建议使用 Node.js 22 和 pnpm 11。

```bash
pnpm install
pnpm dev:web   # 浏览器中调试界面
pnpm dev       # 启动 Vite 与 Electron 桌面外壳
pnpm build     # 类型检查并构建生产版本
```

## 提交 Pull Request

1. 从 `main` 创建一个范围明确的分支。
2. 保持改动聚焦；功能变更应同步更新 README。
3. 在提交前运行 `pnpm build`。
4. 在 Pull Request 中说明改动目的、验证方式和相关 Issue；视觉改动请附截图或录屏。

项目目前没有自动化测试套件。涉及状态管理、流式输出或桌面窗口行为的改动，请在 Pull Request 中写明手工验证过的场景。

## 更新 README 截图

先运行 `pnpm dev:web`，再在另一个终端运行：

```bash
pnpm capture:screenshot
```

命令会将当前空白会话界面写入 `docs/images/sidepane-ui.png`。可以通过 `SIDEPANE_SCREENSHOT_URL` 和 `SIDEPANE_SCREENSHOT_PATH` 环境变量覆盖页面地址与输出位置。

## 报告问题

Bug 报告请包含操作系统、Node.js/pnpm 版本、复现步骤、预期行为和实际行为。Electron 桌面问题还请注明显示器数量及缩放比例。

参与本项目即表示你同意以项目的 [MIT License](LICENSE) 发布自己的贡献。
