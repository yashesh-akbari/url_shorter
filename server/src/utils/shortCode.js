import { customAlphabet } from "nanoid";
const alphabet = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const nanoid = customAlphabet(alphabet, 7); // 7-char code

export const generateCode = () => nanoid();
