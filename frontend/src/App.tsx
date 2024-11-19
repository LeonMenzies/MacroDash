import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useRecoilValue } from "recoil";
import { userAtom } from "./recoil/user";
import { themeAtom } from "./recoil/theme";
import { ElementType } from "react";
import { ThemeProvider as MuiThemeProvider, Box } from "@mui/material";
import {
    createGlobalStyle,
    ThemeProvider as StyledThemeProvider,
} from "styled-components";
import { lightTheme, darkTheme } from "utils/theme";

import { LoginContainer } from "pages/login/LoginContainer";
import { HomeContainer } from "pages/home/HomeContainer";
import { TileLibraryContainer } from "pages/tile_library/TileLibraryContainer";
import { DashboardLibraryContainer } from "pages/dashboard_library/DashboardLibraryContainer";
import { SignUpContainer } from "pages/signup/SignupContainer";
import { SettingsContainer } from "pages/settings/SettingsContainer";
import { PageNotFound } from "utils/PageNotFound";

const GlobalStyle = createGlobalStyle`
  body {
    background-color: ${({ theme }) =>
        theme.palette.background.default} !important;

    ::-webkit-scrollbar {
      width: 12px;
    }
    ::-webkit-scrollbar-track {
      background: ${({ theme }) => theme.customScrollbars.track};
    }
    ::-webkit-scrollbar-thumb {
      background-color: ${({ theme }) => theme.customScrollbars.thumb};
      border-radius: 10px;
      border: 3px solid ${({ theme }) => theme.customScrollbars.track};
    }
  }
`;

export const App = () => {
    const user = useRecoilValue(userAtom);
    const isDarkMode = useRecoilValue(themeAtom);

    function renderElement(
        isAllowed: boolean,
        Component: ElementType,
        redirectPath: string
    ) {
        return isAllowed ? <Component /> : <Navigate to={redirectPath} />;
    }

    const theme = isDarkMode ? darkTheme : lightTheme;

    return (
        <MuiThemeProvider theme={theme}>
            <StyledThemeProvider theme={theme}>
                <GlobalStyle theme={theme} />

                <Box
                    sx={{
                        backgroundColor: theme.palette.background.default,
                        minHeight: "100vh",
                        display: "flex",
                        flexDirection: "column",
                    }}
                >
                    <Routes>
                        <Route path="login" element={<LoginContainer />} />
                        <Route
                            path="signup"
                            element={renderElement(
                                user.loggedIn,
                                SignUpContainer,
                                "/login"
                            )}
                        />
                        <Route
                            path="/"
                            index
                            element={renderElement(
                                user.loggedIn,
                                HomeContainer,
                                "/login"
                            )}
                        />
                        <Route
                            path="/settings"
                            element={renderElement(
                                user.loggedIn,
                                SettingsContainer,
                                "/login"
                            )}
                        />
                        <Route
                            path="/tile-library"
                            element={renderElement(
                                user.loggedIn,
                                TileLibraryContainer,
                                "/login"
                            )}
                        />
                        <Route
                            path="/dashboard-library"
                            element={renderElement(
                                user.loggedIn,
                                DashboardLibraryContainer,
                                "/login"
                            )}
                        />
                        <Route path="*" element={<PageNotFound />} />
                    </Routes>
                </Box>
            </StyledThemeProvider>
        </MuiThemeProvider>
    );
};

export default App;
