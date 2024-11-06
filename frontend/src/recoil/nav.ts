import { atom } from "recoil";

export const navAtom = atom<boolean>({
  key: "nav",
  default: false,
});
