// src/index.ts
import { registerEditorExtension } from "@minecraft/server-editor";
import type { IDisposable } from "@minecraft/server-editor";

export default registerEditorExtension(
  "mcte.starter",
  (uiSession) => {
    const log = uiSession.log;
    log.info("[MCTE] activated");

    // warn を環境差に強くするラッパー
    const warn = (msg: string) => {
      const anyLog = log as any;
      if (typeof anyLog.warning === "function") anyLog.warning(msg);
      else if (typeof anyLog.warn === "function") anyLog.warn(msg);
      else log.info(msg);
    };

    const disposables: IDisposable[] = [];

    const makeDisposable = (clean?: () => void): IDisposable => ({
      teardown() {
        try {
          clean?.();
        } catch (e) {
          warn(`[MCTE] teardown error: ${e}`);
        }
      },
    });

    // Editor UI の型差を吸収
    const s: any = uiSession as any;

    // ---- ツールバー作成（toolbars → toolRail の順に試す） ----
    let toolbar: any = null;
    try {
      if (s?.toolbars?.createToolbar) {
        toolbar = s.toolbars.createToolbar({
          id: "mcte.main",
          displayString: "MCTE",
        });
        log.info("[MCTE] toolbar created via toolbars.createToolbar");
      } else if (s?.toolRail?.createToolbar) {
        toolbar = s.toolRail.createToolbar({
          id: "mcte.main",
          displayString: "MCTE",
        });
        log.info("[MCTE] toolbar created via toolRail.createToolbar");
      } else {
        warn(
          "[MCTE] toolbar API not found; environment may not support toolbar"
        );
      }
    } catch (e) {
      log.error(`[MCTE] toolbar creation failed: ${e}`);
    }

    if (toolbar) {
      // ツールバー破棄を登録
      disposables.push(
        makeDisposable(() => {
          try {
            toolbar.dispose?.();
          } catch {}
          try {
            toolbar.teardown?.();
          } catch {}
        })
      );

      // ---- ボタン（アクション）登録 ----
      let copyAction: any = null;
      try {
        // 一部環境で icon が未対応のことがあるので、無くても動くように
        copyAction = toolbar.registerAction?.({
          id: "mcte.copySelection",
          displayString: "選択をコピー",
          tooltip: "現在の選択をコピーします",
          icon: "copy", // 使えない環境でも致命的にはならない
          onExecute: () => {
            log.info("[MCTE] Copy button clicked");
            // TODO: 本処理をここに実装
          },
        });

        if (copyAction) {
          log.info("[MCTE] action registered (copy)");
          disposables.push(
            makeDisposable(() => {
              try {
                copyAction.dispose?.();
              } catch {}
              try {
                copyAction.teardown?.();
              } catch {}
            })
          );
        } else {
          warn("[MCTE] registerAction returned null/undefined");
        }
      } catch (e) {
        log.error(`[MCTE] action registration failed: ${e}`);
      }
    }

    return disposables; // ← 重要：IDisposable[] を返す
  },
  (uiSession) => {
    uiSession.log.info("[MCTE] shutdown");
  }
);
