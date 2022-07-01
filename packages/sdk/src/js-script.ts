// usage:
// <script src=".." rpc="" maxRetry=""></script>
import { detectHtmlToAddButton } from "./unseal";
import { normalizeUrl } from "./helper";

const RPC: string = normalizeUrl(
  document.currentScript?.getAttribute("rpc") || "https://api.sealblog.xyz"
);

const CLIENT_RPC: string = normalizeUrl(
  document.currentScript?.getAttribute("client") || "https://sealblog.xyz"
);

const MAX_RETRY: number = +(
  document.currentScript?.getAttribute("maxRetry") || 100
);

detectHtmlToAddButton(RPC, MAX_RETRY, CLIENT_RPC);
