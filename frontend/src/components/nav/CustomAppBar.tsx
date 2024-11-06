import React from "react";
import { AppBar, Toolbar, IconButton, Typography, Box } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import styled from "styled-components";
import { useTheme } from "@mui/material/styles";

interface CustomAppBarProps {
    title: string;
    open: boolean;
    handleDrawerOpen: () => void;
    toolbarComponent?: React.ReactNode;
}

export const CustomAppBar = (props: CustomAppBarProps) => {
    const { title, open, handleDrawerOpen, toolbarComponent } = props;
    const theme = useTheme();

    return (
        <StyledCustomAppBar open={open} theme={theme}>
            <IconButton
                color="inherit"
                aria-label="open drawer"
                onClick={handleDrawerOpen}
                edge="start"
                sx={{ mr: 0, ...(open && { display: "none" }) }}
            >
                <MenuIcon />
            </IconButton>
            <Typography
                variant="h6"
                noWrap
                component="div"
                sx={{ flexGrow: 1 }}
            >
                {title}
            </Typography>
            {toolbarComponent}
        </StyledCustomAppBar>
    );
};

const StyledCustomAppBar = styled(Box)<{ open: boolean }>`
    background-color: ${({ theme }) => theme.palette.background.default};
    color: ${({ theme }) => theme.palette.text.primary};
    height: 50px;
    transition: margin-left 0.2s;
    width: 100%;
    padding: 0 16px;
    display: flex;
    flex-direction: row;
    align-items: center;
`;
