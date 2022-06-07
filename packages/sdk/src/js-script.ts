// usage:
// <script src=".." rpc="" maxRetry=""></script>
import { detectHtmlToAddButton } from "./unseal";
import { normalizeUrl } from "./helper";

const RPC: string = normalizeUrl(
  document.currentScript?.getAttribute("rpc") || "https://api.underplay.xyz"
);

const CLIENT_RPC: string = normalizeUrl(
  document.currentScript?.getAttribute("client") || "https://underplay.xyz"
);

const MAX_RETRY: number = +(
  document.currentScript?.getAttribute("maxRetry") || 20
);

detectHtmlToAddButton(RPC, MAX_RETRY, CLIENT_RPC);
