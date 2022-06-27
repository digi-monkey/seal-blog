import CryptoJS from "crypto-js";
import AES from "crypto-js/aes";
import { Base64Str, HexStr, Utf8Str } from "./types";
const sigUtil = require("@metamask/eth-sig-util");
const ethUtil = require("ethereumjs-util");

const MODE = CryptoJS.mode.CBC;
const PADDING = CryptoJS.pad.Pkcs7;
const DECRYPT_ENCODING = CryptoJS.enc.Utf8;
const ENCRYPT_ENCODING = CryptoJS.enc.Base64;
const HASH_ENCODING = CryptoJS.enc.Hex;
const HEX_ENCODING = CryptoJS.enc.Hex;

export function decrypt(
  encryptData: Base64Str,
  _key: HexStr,
  _iv: HexStr
): Utf8Str | null {
  console.log(_key, _iv);
  try {
    const iv = CryptoJS.enc.Hex.parse(_iv.replace("0x", ""));
    const key = CryptoJS.enc.Hex.parse(_key.replace("0x", ""));
    const decodedData = AES.decrypt(encryptData, key, {
      iv,
      mode: MODE,
      padding: PADDING,
    });
    return decodedData.toString(DECRYPT_ENCODING);
  } catch (error) {
    console.error("decrypt error", error);
    return null;
  }
}

export function encrypt(
  message: Utf8Str,
  _key: HexStr,
  _iv: HexStr
): Base64Str {
  const iv = CryptoJS.enc.Hex.parse(_iv.replace("0x", ""));
  const key = CryptoJS.enc.Hex.parse(_key.replace("0x", ""));
  const encodedData = AES.encrypt(message, key, {
    iv,
    mode: MODE,
    padding: PADDING,
  });
  return encodedData.ciphertext.toString(ENCRYPT_ENCODING);
}

export function hash(message: Base64Str) {
  return "0x" + CryptoJS.SHA1(message).toString(HASH_ENCODING);
}

export function generateRandomAesKey() {
  return generateRandomBytes(16).slice(2);
}

export function generateRandomIv() {
  return generateRandomBytes(8).slice(2);
}

export function generateRandomBytes(length: number) {
  return "0x" + CryptoJS.lib.WordArray.random(length).toString(HEX_ENCODING);
}

export async function encryptAesKeyAndIv(
  encryptionPublicKey: string,
  AESKey: string,
  iv: string
) {
  console.info(`pk: ${encryptionPublicKey}, aesKey: ${AESKey}, iv: ${iv}`);
  const encryptedMessage: HexStr = ethUtil.bufferToHex(
    Buffer.from(
      JSON.stringify(
        sigUtil.encrypt({
          publicKey: encryptionPublicKey,
          data: AESKey + iv, // 16 bytes + 8 bytes
          version: "x25519-xsalsa20-poly1305",
        })
      ),
      "utf8"
    )
  );
  return encryptedMessage;
}

export function encryptTextToPk(encryptionPublicKey: string, text: Utf8Str) {
  console.info(`pk: ${encryptionPublicKey}, text: ${text}`);
  const encryptedMessage: HexStr = ethUtil.bufferToHex(
    Buffer.from(
      JSON.stringify(
        sigUtil.encrypt({
          publicKey: encryptionPublicKey,
          data: text, // 16 bytes + 8 bytes
          version: "x25519-xsalsa20-poly1305",
        })
      ),
      "utf8"
    )
  );
  return encryptedMessage;
}
