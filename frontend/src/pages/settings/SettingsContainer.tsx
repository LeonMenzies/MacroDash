import React, { useEffect } from 'react';
import { useRecoilState, useSetRecoilState } from 'recoil';
import { useNavigate } from "react-router-dom";
import styled from 'styled-components';
import usePostApi from "hooks/usePostApi";
import { ApiResponse } from "types/ApiTypes";
import { defaultUser, userAtom } from "recoil/user";
import { themeAtom } from "recoil/theme";
import { NavContainer } from "components/nav/NavContainer";
import { Box, Button, IconButton } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { navAtom } from 'recoil/nav';

/* eslint-disable-next-line */
export interface SettingsContainerProps { }

const SettingsContainer: React.FC<SettingsContainerProps> = () => {
  const setUserAtom = useSetRecoilState(userAtom);
  const [isDarkMode, setIsDarkMode] = useRecoilState(themeAtom);
  const [postLogoutResponse, , postLogout] = usePostApi<null, ApiResponse<null>>("/logout");
  const navigate = useNavigate();
  const setOpen = useSetRecoilState(navAtom);

  const handleLogout = async () => {
    postLogout(null);
  };

  useEffect(() => {
    if (postLogoutResponse.success) {
      setUserAtom(defaultUser);
      navigate("/login");
    }
  }, [postLogoutResponse, navigate, setUserAtom]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <StyledSettingsContainer>
      <Box>
        <IconButton
          aria-label="open drawer"
          onClick={() => setOpen(true)}
          edge="start"
          sx={{ m: "10px 0 10px 16px" }}
        >
          <MenuIcon />
        </IconButton>
      </Box>
      <NavContainer>
        <Content>
          <Section>
            <h2>Profile Settings</h2>
            <p>Manage your profile information.</p>
            <Button onClick={toggleTheme} variant="contained" color="primary">
              {isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            </Button>
            <PlaceholderSetting>Change Password</PlaceholderSetting>
            <PlaceholderSetting>Update Email</PlaceholderSetting>
          </Section>
          <Section>
            <h2>Account Settings</h2>
            <p>Manage your account settings and preferences.</p>
            <PlaceholderSetting>Privacy Settings</PlaceholderSetting>
            <PlaceholderSetting>Language Preferences</PlaceholderSetting>
          </Section>
          <Section>
            <h2>Notification Settings</h2>
            <p>Manage your notification preferences.</p>
            <PlaceholderSetting>Email Notifications</PlaceholderSetting>
            <PlaceholderSetting>Push Notifications</PlaceholderSetting>
          </Section>
          <Button onClick={handleLogout} variant="contained" color="secondary">
            Log Out
          </Button>
        </Content>
      </NavContainer>
    </StyledSettingsContainer >
  );
};

export default SettingsContainer;

const StyledSettingsContainer = styled.div`
  display: flex;
  flex-direction: column;
  background-color: ${({ theme }) => theme.palette.background.default};
  min-height: 100vh;
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin: 0 20px 20px 20px;
`;

const Section = styled.section`
  padding: 20px;
  background-color: ${({ theme }) => theme.palette.background.paper};
  border-radius: ${({ theme }) => theme.customBorders.radius};
  box-shadow: ${({ theme }) => theme.customShadows[theme.palette.mode]};

  h2 {
    margin-top: 0;
    font-size: 20px;
    color: ${({ theme }) => theme.palette.text.primary};
  }

  p {
    margin: 10px 0 0;
    color: ${({ theme }) => theme.palette.text.secondary};
  }
`;

const PlaceholderSetting = styled.div`
  margin-top: 10px;
  padding: 10px;
  background-color: ${({ theme }) => theme.palette.background.default};
  border-radius: ${({ theme }) => theme.customBorders.radius};
  color: ${({ theme }) => theme.palette.text.primary};
`;