import { atom } from "recoil";
import { UserT } from "types/ObjectTypes";
import { recoilPersist } from "recoil-persist";

const { persistAtom } = recoilPersist();

export const defaultUser = {
  loggedIn: false,
  id: 0,
  firstName: "",
  lastName: "",
  email: "",
  roles: "",
};

export const userAtom = atom<UserT>({
  key: "user",
  default: defaultUser,
  effects_UNSTABLE: [persistAtom],
});
