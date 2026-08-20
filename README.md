# SidePane UI

侧边窗格形态的 AI 助手前端界面（参考微软 Copilot 侧边面板交互形态）。

> **本项目仅包含前端 UI 与交互逻辑（纯 React，无任何后端/服务进程/协议层）。**
> 对话回复当前为"回显用户输入 + 逐字流式输出"的纯浏览器内模拟；后续对接外部后台服务时，替换 `src/mock/echoStream.ts` 即可。

## 技术栈

- Vite 5 + React 18 + TypeScript（strict）
- react-markdown + remark-gfm + rehype-highlight（Markdown 渲染与代码高亮）
- 手写 CSS：设计令牌（`src/styles/tokens.css`）+ CSS Modules
- 状态管理：React Context + useReducer（`src/store/ChatStore.tsx`），纯内存态，不持久化

## 运行

```bash
pnpm install
pnpm dev        # http://localhost:5173
pnpm build      # tsc --noEmit && vite build
```

## 功能清单

- **顶栏**：品牌标识、会话列表开关、新建对话
- **会话列表**（滑出式面板）：置顶分组 + 时间排序、流式生成中 spinner、行内 `⋯` 菜单（重命名 / 置顶 / 标记颜色 / 删除确认）、空态
- **聊天区**：用户气泡 + AI 消息流；智能滚动跟随（仅在底部时自动滚动，上翻暂停跟随并浮现"回到底部"按钮）；自定义细滚动条（聊天区与输入区统一）；选中文字右键菜单（复制 / 全选）
- **消息操作**：AI 消息生成完成后显示复制按钮（复制原始 Markdown，代码块另带"复制"按钮）
- **流式输出**：逐字回显 + 思考延迟 + 闪烁光标；生成中发送按钮切换为"停止"
- **输入区**：自动增高 textarea、Enter 发送 / Shift+Enter 换行（兼容中文输入法组词）、会话级草稿保留
- **其他**：空态欢迎界面（示例问题一键提问）、Toast 轻提示、确认 / 重命名弹窗、AI 自动命名会话（首句截断）

## 目录结构

```
src/
  main.tsx / App.tsx        入口与外壳
  types.ts                  领域类型（会话/消息/标记色）
  store/ChatStore.tsx       状态层：reducer + provider + 流式编排（AbortController）
  mock/echoStream.ts        流式回显模拟（唯一需要替换的"假数据"点）
  utils/                    工具（文本截断 / 剪贴板）
  components/               组件（TopBar / ConversationPanel / ChatArea /
                            MessageItem / MarkdownView / InputArea /
                            WelcomeEmpty / Toast / Modal / ContextMenu /
                            ScrollbarTrack / Icon）
  styles/                   tokens.css（Fluent 浅色设计令牌）+ global.css
```

## 设计参考

交互细节借鉴了此前项目 Yino 的可取之处：智能滚动跟随、会话置顶/标记色、生成完成才显示操作按钮、选中文字右键菜单、自定义滚动条、空态引导、Toast 提示等；本项目中均以 React 组件化方式重新实现。
