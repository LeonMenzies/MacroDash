import { useEffect, useState } from "react";
import styled from "styled-components";
import { useSetRecoilState } from "recoil";
import { userAtom } from "../../recoil/user";
import { themeAtom } from "../../recoil/theme";
import { useNavigate } from "react-router-dom";
import usePostApi from "hooks/usePostApi";
import { SignUpRequestT } from "types/ApiTypes";
import { useTheme } from '@mui/material/styles';
import { SignUpForm } from "pages/signup/SignupForm";

export interface SignUpContainerProps { }

export function SignUpContainer(props: SignUpContainerProps) {
  const setUserAtom = useSetRecoilState(userAtom);
  const setThemeAtom = useSetRecoilState(themeAtom);
  const navigate = useNavigate();
  const [postSignUpResponse, postSignUpLoading, postSignUp] = usePostApi<SignUpRequestT, any>("/signup");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [user, setUser] = useState<SignUpRequestT>({
    firstName: "Leon",
    lastName: "Menzies",
    email: "leon.menzies@mm.com",
    password: "Testing123!",
  });
  const theme = useTheme();

  useEffect(() => {
    if (postSignUpResponse.success && postSignUpResponse.data) {
      setUserAtom({
        loggedIn: true,
        id: postSignUpResponse.data.id,
        firstName: postSignUpResponse.data.firstName,
        lastName: postSignUpResponse.data.lastName,
        email: postSignUpResponse.data.email,
      });
      setThemeAtom(postSignUpResponse.data.darkMode);
      navigate("/dashboard");
    } else if (postSignUpResponse.errorMessage) {
      setErrorMessage(postSignUpResponse.errorMessage);
    }
  }, [postSignUpResponse, setUserAtom, setThemeAtom, navigate]);

  const handleFieldChange = (fieldName: keyof typeof user, value: string) => {
    setUser({
      ...user,
      [fieldName]: value,
    });
  };

  const handleSignUp = async () => {
    postSignUp(user);
  };

  const handleBlur = () => {
    setErrorMessage("");
  }

  return (
    <StyledSignUpContainer theme={theme}>
      <SignUpForm
        user={user}
        loading={postSignUpLoading}
        handleFieldChange={handleFieldChange}
        handleSignUp={handleSignUp}
        errorMessage={errorMessage}
        onBlur={handleBlur}
      />
    </StyledSignUpContainer>
  );
}

export default SignUpContainer;

const StyledSignUpContainer = styled.div`
  background-color: ${({ theme }) => theme.palette.background.default};
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
`;