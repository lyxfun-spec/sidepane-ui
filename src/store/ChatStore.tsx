import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from 'react';
import type { ChatMessage, Conversation } from '../types';
import { truncateTitle, uid } from '../utils/text';
import { echoStream } from '../mock/echoStream';

interface ChatState {
  conversations: Conversation[];
  activeId: string | null;
  /** 正在流式生成的会话 id */
  streamingId: string | null;
  /** 各会话未发送的草稿 */
  drafts: Record<string, string>;
}

const initialState: ChatState = {
  conversations: [],
  activeId: null,
  streamingId: null,
  drafts: {},
};

type Action =
  | { type: 'NEW_CONVERSATION' }
  | { type: 'SWITCH'; id: string }
  | { type: 'RENAME'; id: string; title: string }
  | { type: 'DELETE'; id: string }
  | { type: 'TOGGLE_PIN'; id: string }
  | { type: 'SET_MARK'; id: string; color: string | null }
  | { type: 'SET_DRAFT'; id: string; text: string }
  | { type: 'SEND_USER'; id: string; text: string }
  | { type: 'APPEND_TOKEN'; id: string; token: string }
  | { type: 'STREAM_END'; id: string; stopped: boolean };

function findConv(state: ChatState, id: string): Conversation | undefined {
  return state.conversations.find((c) => c.id === id);
}

function reducer(state: ChatState, action: Action): ChatState {
  switch (action.type) {
    case 'NEW_CONVERSATION': {
      const conv: Conversation = {
        id: uid(),
        title: '新对话',
        messages: [],
        pinned: false,
        markColor: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      return {
        ...state,
        conversations: [conv, ...state.conversations],
        activeId: conv.id,
      };
    }

    case 'SWITCH':
      if (!findConv(state, action.id)) return state;
      return { ...state, activeId: action.id };

    case 'RENAME': {
      const title = action.title.trim();
      if (!title) return state;
      return {
        ...state,
        conversations: state.conversations.map((c) =>
          c.id === action.id ? { ...c, title } : c
        ),
      };
    }

    case 'DELETE': {
      const conversations = state.conversations.filter((c) => c.id !== action.id);
      const drafts = { ...state.drafts };
      delete drafts[action.id];
      const activeId =
        state.activeId === action.id ? conversations[0]?.id ?? null : state.activeId;
      const streamingId =
        state.streamingId === action.id ? null : state.streamingId;
      return { ...state, conversations, drafts, activeId, streamingId };
    }

    case 'TOGGLE_PIN':
      return {
        ...state,
        conversations: state.conversations.map((c) =>
          c.id === action.id ? { ...c, pinned: !c.pinned } : c
        ),
      };

    case 'SET_MARK':
      return {
        ...state,
        conversations: state.conversations.map((c) =>
          c.id === action.id ? { ...c, markColor: action.color } : c
        ),
      };

    case 'SET_DRAFT':
      return { ...state, drafts: { ...state.drafts, [action.id]: action.text } };

    case 'SEND_USER': {
      const now = Date.now();
      const userMsg: ChatMessage = {
        id: uid(),
        role: 'user',
        content: action.text,
        status: 'done',
        createdAt: now,
      };
      const aiMsg: ChatMessage = {
        id: uid(),
        role: 'assistant',
        content: '',
        status: 'streaming',
        createdAt: now,
      };

      let conversations = state.conversations;
      let activeId = state.activeId;
      if (!findConv(state, action.id)) {
        const conv: Conversation = {
          id: action.id,
          title: truncateTitle(action.text),
          messages: [],
          pinned: false,
          markColor: null,
          createdAt: now,
          updatedAt: now,
        };
        conversations = [conv, ...conversations];
        activeId = action.id;
      }

      conversations = conversations.map((c) =>
        c.id === action.id
          ? {
              ...c,
              title:
                c.title === '新对话' || c.title === ''
                  ? truncateTitle(action.text)
                  : c.title,
              messages: [...c.messages, userMsg, aiMsg],
              updatedAt: now,
            }
          : c
      );

      return {
        ...state,
        conversations,
        activeId,
        streamingId: action.id,
        drafts: { ...state.drafts, [action.id]: '' },
      };
    }

    case 'APPEND_TOKEN': {
      if (state.streamingId !== action.id) return state;
      return {
        ...state,
        conversations: state.conversations.map((c) => {
          if (c.id !== action.id) return c;
          const messages = [...c.messages];
          const last = messages[messages.length - 1];
          if (!last || last.role !== 'assistant') return c;
          messages[messages.length - 1] = {
            ...last,
            content: last.content + action.token,
          };
          return { ...c, messages };
        }),
      };
    }

    case 'STREAM_END': {
      if (state.streamingId !== action.id) return state;
      const now = Date.now();
      return {
        ...state,
        streamingId: null,
        conversations: state.conversations.map((c) => {
          if (c.id !== action.id) return c;
          const messages = [...c.messages];
          const last = messages[messages.length - 1];
          if (!last || last.role !== 'assistant') return c;
          messages[messages.length - 1] = {
            ...last,
            status: action.stopped ? 'stopped' : 'done',
          };
          return { ...c, messages, updatedAt: now };
        }),
      };
    }

    default:
      return state;
  }
}

interface ChatContextValue {
  state: ChatState;
  send: (text: string) => void;
  stop: () => void;
  newConversation: () => void;
  switchConversation: (id: string) => void;
  renameConversation: (id: string, title: string) => void;
  deleteConversation: (id: string) => void;
  togglePin: (id: string) => void;
  setMarkColor: (id: string, color: string | null) => void;
  setDraft: (text: string) => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const abortRef = useRef<AbortController | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  const send = useCallback((text: string) => {
    const s = stateRef.current;
    const trimmed = text.trim();
    if (!trimmed || s.streamingId) return;

    const convId = s.activeId ?? uid();
    dispatch({ type: 'SEND_USER', id: convId, text: trimmed });

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    void (async () => {
      try {
        await echoStream(trimmed, {
          signal: ctrl.signal,
          onToken: (token) => dispatch({ type: 'APPEND_TOKEN', id: convId, token }),
        });
        dispatch({ type: 'STREAM_END', id: convId, stopped: false });
      } catch {
        // 用户主动停止时保留已生成内容，标记为 stopped
        dispatch({ type: 'STREAM_END', id: convId, stopped: ctrl.signal.aborted });
      } finally {
        if (abortRef.current === ctrl) abortRef.current = null;
      }
    })();
  }, []);

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const newConversation = useCallback(() => dispatch({ type: 'NEW_CONVERSATION' }), []);

  const switchConversation = useCallback(
    (id: string) => dispatch({ type: 'SWITCH', id }),
    []
  );

  const renameConversation = useCallback(
    (id: string, title: string) => dispatch({ type: 'RENAME', id, title }),
    []
  );

  const deleteConversation = useCallback((id: string) => {
    const s = stateRef.current;
    if (s.streamingId === id) abortRef.current?.abort();
    dispatch({ type: 'DELETE', id });
  }, []);

  const togglePin = useCallback((id: string) => dispatch({ type: 'TOGGLE_PIN', id }), []);

  const setMarkColor = useCallback(
    (id: string, color: string | null) => dispatch({ type: 'SET_MARK', id, color }),
    []
  );

  const setDraft = useCallback((text: string) => {
    const s = stateRef.current;
    if (!s.activeId) return;
    dispatch({ type: 'SET_DRAFT', id: s.activeId, text });
  }, []);

  const value = useMemo<ChatContextValue>(
    () => ({
      state,
      send,
      stop,
      newConversation,
      switchConversation,
      renameConversation,
      deleteConversation,
      togglePin,
      setMarkColor,
      setDraft,
    }),
    [
      state,
      send,
      stop,
      newConversation,
      switchConversation,
      renameConversation,
      deleteConversation,
      togglePin,
      setMarkColor,
      setDraft,
    ]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat(): ChatContextValue {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat 必须在 ChatProvider 内使用');
  return ctx;
}
