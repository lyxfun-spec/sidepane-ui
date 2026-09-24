export {};

declare global {
  interface Window {
    sidepaneDesktop?: {
      platform: 'win32' | 'darwin' | 'linux';
      hideWindow: () => Promise<void>;
      beginResize: () => void;
      resizeTo: (screenX: number) => void;
      endResize: () => void;
      onWindowVisibilityChange: (
        callback: (state: {
          visible: boolean;
          animateFromHidden: boolean;
          id: number;
        }) => void
      ) => () => void;
    };
  }
}
