import { ReactNode } from "react";
import { styled } from "@mui/material/styles";
import { Box } from "@mui/material";
import { CustomDrawer } from "components/nav/CustomDrawer";

/* eslint-disable-next-line */
export interface NavContainerProps {
    children: ReactNode;
}

const Main = styled("main")(({ theme }) => ({
    flexGrow: 1,
    height: "calc(100vh - 50px)",
    transition: theme.transitions.create("margin", {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
    }),
}));

export const NavContainer = (props: NavContainerProps) => {
    const { children } = props;

    return (
        <Box>
            <CustomDrawer />
            <Main>{children}</Main>
        </Box>
    );
};
