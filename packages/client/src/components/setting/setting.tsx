import { FormControl, Select } from "@material-ui/core";
import MenuItem from "@material-ui/core/MenuItem/MenuItem";
import { HexNum } from "@seal-blog/sdk";
import React, { useContext } from "react";
import { CHAIN_NETWORKS } from "../../configs";
import Popup from "reactjs-popup";
import "./modal.css";
import { Context } from "../../hooks/useContext";
import { LocalStore } from "../../localStore";
import { Box, IconClose, Stack, Text } from "degen";

export function SelectChainId() {
  const contextNetwork = useContext(Context).network;

  const saveChainId = (chainId: HexNum) => {
    contextNetwork.setSelectChainId(chainId);
    LocalStore.saveSelectChainId(chainId);
  };

  const handleChange = (
    event: React.ChangeEvent<{ name?: string | undefined; value: unknown }>
  ) => {
    event.preventDefault();
    event.stopPropagation();

    saveChainId(event.target.value as HexNum);
  };

  const networks = CHAIN_NETWORKS;
  const chainIdList = Object.keys(networks);
  const chainIdSelect = chainIdList.map((id, index) => (
    <MenuItem key={index} value={id}>
      {networks[id].chainName}({id})
    </MenuItem>
  ));

  return (
    <div style={{ padding: "20px" }}>
      <FormControl fullWidth>
        <Box marginBottom={"3"}>
          <Text size={"large"} transform="capitalize">
            multi-chain switch: choose network
          </Text>
        </Box>
        <Select
          labelId="demo-simple-select-label"
          id="demo-simple-select"
          label="chainId"
          onChange={handleChange}
        >
          {chainIdSelect}
        </Select>
      </FormControl>
    </div>
  );
}

export function PopupSelectChainId() {
  const contextNetwork = useContext(Context).network;

  return (
    <Popup
      open={contextNetwork.selectChainId == null}
      position={"center center"}
      modal
      closeOnDocumentClick={false}
    >
      <SelectChainId />
    </Popup>
  );
}

export interface SettingMenuProp {
  open: boolean;
  close: () => any;
}
export function SettingMenu(props: SettingMenuProp) {
  const { open, close } = props;
  return (
    <div>
      <Popup
        open={open}
        position={"center center"}
        modal
        closeOnDocumentClick={false}
      >
        <Stack align={"flex-end"}>
          <a onClick={close}>
            <IconClose />
          </a>
        </Stack>
        <SelectChainId />
      </Popup>
    </div>
  );
}
