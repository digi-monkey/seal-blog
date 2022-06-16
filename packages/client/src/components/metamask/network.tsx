import { Card } from "@material-ui/core";
import { useContext } from "react";
import { getChainNetwork } from "../../configs";
import { Context } from "../../hooks/useContext";

export function Network() {
  const chainId = useContext(Context).network.selectChainId;
  return (
    <Card style={{ padding: "15px" }}>
      {chainId && (
        <span>
          On {"<"}
          {getChainNetwork(chainId).chainName}
          {">"}
          {",  "}First time on this network? Use{" "}
          <a
            target={"_blank"}
            href={getChainNetwork(chainId).depositEntry || ""}
          >
            Deposit Entry
          </a>
          {"  "} or{" "}
          <a target={"_blank"} href={getChainNetwork(chainId).helpEntry || ""}>
            More Help
          </a>
        </span>
      )}
      {chainId == null && <div>No network, Please Select ChainId..</div>}
    </Card>
  );
}
