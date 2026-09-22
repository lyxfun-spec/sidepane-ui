# SidePane UI

侧边窗格形态的 AI 助手前端界面（参考微软 Copilot 侧边面板交互形态）。

> **本项目包含 React UI 与 Electron 桌面外壳，不包含 Agent 后端、服务进程或协议层。**
> 对话回复当前为"回显用户输入 + 逐字流式输出"的纯浏览器内模拟；后续对接外部后台服务时，替换 `src/mock/echoStream.ts` 即可。

## 技术栈

- Vite 5 + React 18 + TypeScript（strict）
- Electron 桌面外壳（Windows 优先，保留 macOS 适配结构）
- react-markdown + remark-gfm + rehype-highlight（Markdown 渲染与代码高亮）
- 手写 CSS：设计令牌（`src/styles/tokens.css`）+ CSS Modules
- 状态管理：React Context + useReducer（`src/store/ChatStore.tsx`），纯内存态，不持久化

## 运行

```bash
pnpm install
pnpm dev        # 启动 Vite（5174）与 Electron 侧边栏窗口
pnpm dev:web    # 仅在浏览器中预览 UI
pnpm build      # 类型检查并构建前端
```

桌面版默认停靠在当前显示器右侧，不占用 Windows 任务栏；显示和隐藏时会从
屏幕右缘滑入或滑出。可通过系统托盘控制侧边栏，全局快捷键为
`Ctrl/Cmd + Shift + Space`。窗口关闭按钮会将侧边栏滑出并隐藏，托盘菜单中的
“退出”才会结束应用。侧边栏位置固定不可拖动，只能通过左边缘调整宽度。顶栏
关闭按钮用于收起侧边栏。侧边栏展开时固定置于其他普通窗口上方，不提供关闭
置顶的选项。

## 功能清单

- **顶栏**：品牌标识、会话列表开关、新建对话
- **会话列表**（滑出式面板）：按更新时间排序、流式生成中 spinner、行内 `⋯` 菜单（重命名 / 删除确认）、空态
- **聊天区**：用户气泡 + AI 消息流；智能滚动跟随（仅在底部时自动滚动，上翻暂停跟随并浮现"回到底部"按钮）；自定义细滚动条（聊天区与输入区统一）；选中文字右键菜单（复制 / 全选）
- **消息操作**：AI 消息生成完成后在消息左下角**常驻**复制按钮（复制原始 Markdown，代码块另带"复制"按钮）
- **流式输出**：逐字回显 + 思考延迟 + 闪烁光标；生成中发送按钮切换为"停止"
- **输入区**：悬浮输入框（无边框分区、带阴影）、自动增高 textarea、Enter 发送 / Shift+Enter 换行（兼容中文输入法组词）、会话级草稿保留、Yino 风格简洁发送/停止按钮（无底色纯图标）
- **其他**：空态欢迎界面（示例问题一键提问）、Toast 轻提示、确认 / 重命名弹窗、AI 自动命名会话（首句截断）

## 目录结构

```
src/
  main.tsx / App.tsx        入口与外壳
  types.ts                  领域类型（会话/消息）
  store/ChatStore.tsx       状态层：reducer + provider + 流式编排（AbortController）
  mock/echoStream.ts        流式回显模拟（唯一需要替换的"假数据"点）
  utils/                    工具（文本截断 / 剪贴板）
  components/               组件（TopBar / ConversationPanel / ChatArea /
                            MessageItem / MarkdownView / InputArea /
                            WelcomeEmpty / Toast / Modal / ContextMenu /
                            ScrollbarTrack / Icon）
  styles/                   tokens.css（Fluent 浅色设计令牌）+ global.css
electron/
  main.cjs                  窗口、托盘、快捷键与状态记忆
  preload.cjs               安全的桌面能力桥接
```

## 设计参考

交互细节借鉴了此前项目 Yino 的可取之处：智能滚动跟随、生成完成才显示操作按钮、选中文字右键菜单、自定义滚动条、空态引导、Toast 提示、简洁的发送/停止按钮等；本项目中均以 React 组件化方式重新实现。
