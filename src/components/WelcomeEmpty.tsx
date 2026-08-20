import { useChat } from '../store/ChatStore';
import { Icon } from './Icon';
import styles from './WelcomeEmpty.module.css';

const SUGGESTIONS = [
  '帮我写一个快速排序的 Python 示例',
  '总结一下这个需求的核心要点',
  '解释 React 的 useEffect 是什么',
];

export function WelcomeEmpty() {
  const { send } = useChat();

  return (
    <div className={styles.welcome}>
      <Icon name="spark" size={40} className={styles.logo} />
      <h2 className={styles.heading}>有什么可以帮你？</h2>
      <p className={styles.sub}>
        当前为纯前端 UI 演示：AI 将回显你的输入并模拟流式输出效果。
      </p>
      <div className={styles.chips}>
        {SUGGESTIONS.map((s) => (
          <button key={s} type="button" className={styles.chip} onClick={() => send(s)}>
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
