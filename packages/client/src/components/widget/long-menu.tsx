import React from "react";
import IconButton from "@material-ui/core/IconButton";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import MoreVertIcon from "@material-ui/icons/MoreVert";
import crypto from "crypto";

const ITEM_HEIGHT = 48;

export interface LongMenuProp {
  style?: any;
  options?: any[];
  menuStyle?: any;
}

export default function LongMenu(props: LongMenuProp) {
  const style = props.style || {};
  const options = props.options || [];
  const menuStyle = props.menuStyle || {};
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: any) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <span>
      <IconButton
        style={style}
        aria-label="more"
        aria-controls="long-menu"
        aria-haspopup="true"
        onClick={handleClick}
      >
        <MoreVertIcon />
      </IconButton>
      <Menu
        id="long-menu"
        anchorEl={anchorEl}
        keepMounted
        open={open}
        onClose={handleClose}
        PaperProps={{
          style: {
            ...{
              maxHeight: ITEM_HEIGHT * 4.5,
            },
            ...menuStyle,
          },
        }}
      >
        {options.map((option) => (
          <MenuItem
            key={crypto.randomBytes(2).toString("hex")}
            onClick={handleClose}
          >
            {option}
          </MenuItem>
        ))}
      </Menu>
    </span>
  );
}
