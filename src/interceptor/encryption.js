import CryptoJS from "crypto-js";

export const handleEncrypt = (message) => {
  const encrypted = CryptoJS.AES.encrypt(
    message,
    ACCESS_TOKEN_SECRET
  ).toString();
  return encrypted;
};
export const handleDecrypt = (encryptedMessage) => {
  if (encryptedMessage) {
    const decrypted = CryptoJS.AES.decrypt(
      encryptedMessage,
      ACCESS_TOKEN_SECRET
    ).toString(CryptoJS.enc.Utf8);
    return decrypted;
  }
};

const ACCESS_TOKEN_SECRET =
  "7fef283c210814b2b886ebd1a1ff64ff39f6bf35129a13835ac56f82c5cb3e311b0779ffbea1d194fea726af81395b88e88e06e85b3b0ee83c672499d3a5390b8d2523bac9439d82d3ae9e5b85ae4a2070edb9f260bae7aa49b2dd8f9c7131d6ed3e327fd18bdde160d87d1edb3b4fcfd5d26c3bb616a20d2a40fd53792165a4";
