// src/index.ts
import { registerEditorExtension } from "@minecraft/server-editor";
import type { IDisposable } from "@minecraft/server-editor";

export default registerEditorExtension(
  "mcte.starter",
  (uiSession) => {
    uiSession.log.info("MCTE Starter: activated");

    const disposables: IDisposable[] = [];

    // 片付け用のラッパ（IDisposable は teardown のみ要求される版）
    const makeDisposable = (clean?: () => void): IDisposable => ({
      teardown() {
        try { clean?.(); } catch { /* noop */ }
      },
    });

    // Minimal テンプレは UI 周りの型が無いことがあるので any で吸収
    const sessionAny = uiSession as any;

    // ツールバー作成（環境差に備えて候補を順に試す）
    const toolbar =
      sessionAny?.toolbars?.createToolbar?.({ id: "mcte.main", displayString: "MCTE" }) ??
      sessionAny?.toolRail?.createToolbar?.({ id: "mcte.main", displayString: "MCTE" }) ??
      null;

    if (toolbar) {
      // toolbar の破棄処理（存在すれば呼ぶ）
      disposables.push(
        makeDisposable(() => {
          try { toolbar.dispose?.(); } catch {}
          try { toolbar.teardown?.(); } catch {}
        })
      );

      const action = toolbar.registerAction?.({
        id: "mcte.copySelection",
        // 一部バージョンは title ではなく displayString
        displayString: "選択をコピー",
        icon: "copy",
        tooltip: "現在の選択をコピーします",
        onExecute: () => {
          uiSession.log.info("[MCTE] Copy button clicked");
          // TODO: ここに本処理
        },
      }) ?? null;

      if (action) {
        disposables.push(
          makeDisposable(() => {
            try { action.dispose?.(); } catch {}
            try { action.teardown?.(); } catch {}
          })
        );
      }
    } else {
      uiSession.log.info("[MCTE] toolbar API が見つからない/非対応の可能性（Simple Empty 推奨）");
    }

    return disposables; // ← 重要：IDisposable[] を返す
  },
  (uiSession) => {
    uiSession.log.info("MCTE Starter: shutdown");
  }
);
