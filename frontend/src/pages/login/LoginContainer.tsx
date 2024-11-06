import { useEffect, useState } from "react";
import styled from "styled-components";
import LoginForm from "./LoginForm";
import { useSetRecoilState } from "recoil";
import { userAtom } from "../../recoil/user";
import { themeAtom } from "../../recoil/theme";
import { useNavigate } from "react-router-dom";
import usePostApi from "hooks/usePostApi";
import { LoginRequestT, LoginResponseT } from "types/ApiTypes";
import { useTheme } from '@mui/material/styles';

export interface LoginContainerProps { }

export function LoginContainer(props: LoginContainerProps) {
  const setUserAtom = useSetRecoilState(userAtom);
  const setThemeAtom = useSetRecoilState(themeAtom);
  const navigate = useNavigate();
  const [postLoginResponse, postLoginLoading, postLogin] = usePostApi<LoginRequestT, LoginResponseT>("/login");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [user, setUser] = useState<LoginRequestT>({
    email: "leon.menzies@mm.com",
    password: "Testing123!",
  });
  const theme = useTheme();

  useEffect(() => {
    if (postLoginResponse.success && postLoginResponse.data) {
      setUserAtom({
        loggedIn: true,
        id: postLoginResponse.data.id,
        firstName: postLoginResponse.data.firstName,
        lastName: postLoginResponse.data.lastName,
        email: postLoginResponse.data.email,
      });
      navigate("/");
    } else {
      setErrorMessage(postLoginResponse.errorMessage);
    }
  }, [postLoginResponse, setUserAtom, setThemeAtom, navigate]);

  const handleFieldChange = (fieldName: keyof typeof user, value: string) => {
    setUser({
      ...user,
      [fieldName]: value,
    });
  };

  const handleLogin = async () => {
    postLogin(user);
  };

  const handleBlur = () => {
    setErrorMessage("");
  };

  return (
    <StyledLoginContainer theme={theme}>
      <LoginForm
        user={user}
        handleFieldChange={handleFieldChange}
        handleLogin={handleLogin}
        loading={postLoginLoading}
        errorMessage={errorMessage}
        onBlur={handleBlur}
      />
    </StyledLoginContainer>
  );
}

export default LoginContainer;

const StyledLoginContainer = styled.div`
  background-color: ${({ theme }) => theme.palette.background.default};
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
`;