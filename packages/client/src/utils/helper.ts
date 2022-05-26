export const convertTimestamp = (ts: string | number) => {
  if (typeof ts === "string") {
    return new Date(parseInt(ts)).toLocaleTimeString();
  } else {
    return new Date(ts).toLocaleTimeString();
  }
};

export const hex2dec = (num: string) => {
  return BigInt(num).toString(10);
};

export const dec2hex = (num: string) => {
  return BigInt(num).toString(16);
};

export const shannonToCkb = (amount: string) => {
  return (BigInt(amount) / BigInt(1_0000_0000)).toString();
};

export const displayEthAddress = (addr: string | undefined) => {
  return "0x" + addr?.slice(2, 8).toUpperCase();
};
