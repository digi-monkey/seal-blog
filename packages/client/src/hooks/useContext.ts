import { HexNum } from "@seal-blog/sdk";
import React, { Dispatch, SetStateAction } from "react";

export interface AppContext {
  network: {
    selectChainId: HexNum | null | undefined;
    setSelectChainId: Dispatch<SetStateAction<HexNum | undefined>>;
  };
}

export const Context = React.createContext<AppContext>({
  network: {
    selectChainId: undefined,
    setSelectChainId: () => {},
  },
});
