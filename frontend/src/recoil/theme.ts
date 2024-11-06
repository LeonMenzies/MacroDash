import { atom } from "recoil";
import { recoilPersist } from "recoil-persist";

const { persistAtom } = recoilPersist();

export const themeAtom = atom<Boolean>({
    key: "theme",
    default: false,
    effects_UNSTABLE: [persistAtom],
});