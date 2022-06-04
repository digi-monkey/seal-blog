// usage:
// <script src=".." rpc="" maxRetry=""></script>
import { addDecryptButton } from "./unseal";

const RPC: string =
  document.currentScript?.getAttribute("rpc") || "https://api.underplay.xyz";
const MAX_RETRY: number = +(
  document.currentScript?.getAttribute("maxRetry") || 20
);

try {
  if (window) {
    let isSuccess = false;
    let retryCount = 0;

    // first time
    window.addEventListener("load", () => {
      isSuccess = addDecryptButton(RPC);
    });

    // retry if failed
    if (isSuccess === false) {
      const t = setInterval(() => {
        isSuccess = addDecryptButton(RPC);
        retryCount++;
        console.log(`[unseal.js] retry ${retryCount} times..`);

        if (retryCount > MAX_RETRY) {
          clearInterval(t);
        }

        if (isSuccess) {
          clearInterval(t);
        }
      }, 5000);
    }
  }
} catch (error) {}
