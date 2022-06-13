import { Card } from "@material-ui/core";
import { configChain } from "../../api";

export function Network() {
  return (
    <Card style={{ padding: "15px" }}>
      On {"<"}
      {configChain.chainName}
      {">"}
      {",  "}First time on this network? Use{" "}
      <a target={"_blank"} href={configChain.depositEntry}>
        Deposit Entry
      </a>
      {"  "} or{" "}
      <a target={"_blank"} href={configChain.helpEntry}>
        More Help
      </a>
    </Card>
  );
}
