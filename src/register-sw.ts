import { registerSW } from "virtual:pwa-register";

const UPDATE_INTERVAL = 60 * 60 * 1000;

// ホーム画面から開いたPWAは再読み込みされずに再開されることが多く、
// ブラウザ任せだと更新の確認がなかなか行われない。
// そのため画面に戻ったときと1時間ごとに自分で確認する。
// 新しいバージョンが見つかるとautoUpdateによりページが再読み込みされる。
registerSW({
  immediate: true,
  onRegisteredSW(swUrl, registration) {
    if (!registration) {
      return;
    }
    const checkForUpdate = async () => {
      if (registration.installing || !navigator.onLine) {
        return;
      }
      try {
        // CDNなどに古いsw.jsが残っていても最新を取りに行く
        const response = await fetch(swUrl, {
          cache: "no-store",
          headers: { "cache-control": "no-cache" },
        });
        if (response.status === 200) {
          await registration.update();
        }
      } catch (e) {
        console.error("Service Workerの更新確認に失敗しました", e);
      }
    };
    setInterval(checkForUpdate, UPDATE_INTERVAL);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        checkForUpdate();
      }
    });
  },
});
