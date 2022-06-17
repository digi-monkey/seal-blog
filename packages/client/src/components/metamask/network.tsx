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
          {"<"}
          {getChainNetwork(chainId).chainName}
          {">"}
          {",  "}First time on this network?
          {getChainNetwork(chainId).depositEntry && (
            <span>
              Use{" "}
              <a
                target={"_blank"}
                href={getChainNetwork(chainId).depositEntry!}
              >
                Deposit Entry
              </a>
              {"  "} or
            </span>
          )}
          {" "}
          <a
            target={"_blank"}
            href={getChainNetwork(chainId).helpEntry || "/404"}
          >
            More Help
          </a>
        </span>
      )}
      {chainId == null && <div>No network, Please Select ChainId..</div>}
      <span>{" "} (Switch multi-chain in Setting)</span>
    </Card>
  );
}
