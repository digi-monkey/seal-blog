import { addDecryptButton } from "./unseal";

try {
  if (window) {
    let isSuccess = false;
    let retryCount = 0;
    const maxRetry = 15;

    // first time
    window.addEventListener("load", () => {
      isSuccess = addDecryptButton();
    });

    // retry if failed
    if (isSuccess === false) {
      const t = setInterval(() => {
        isSuccess = addDecryptButton();
        retryCount++;
        console.log(`[unseal.js] retry ${retryCount} times..`);

        if (retryCount > maxRetry) {
          clearInterval(t);
        }

        if (isSuccess) {
          clearInterval(t);
        }
      }, 5000);
    }
  }
} catch (error) {}
