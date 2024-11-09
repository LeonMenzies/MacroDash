import React from "react";
import {
    Drawer,
    IconButton,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    styled,
    useTheme,
    ClickAwayListener,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import { useNavigate, useLocation } from "react-router-dom";
import { useRecoilState } from "recoil";
import { navAtom } from "recoil/nav";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ListIcon from "@mui/icons-material/List";
import SettingsIcon from "@mui/icons-material/Settings";
import RecentActorsIcon from "@mui/icons-material/RecentActors";

const drawerWidth = 240;

interface CustomDrawerProps {}

export const CustomDrawer = (props: CustomDrawerProps) => {
    const theme = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const [open, setOpen] = useRecoilState(navAtom);

    const menuItems = [
        { text: "Home", icon: <DashboardIcon />, path: "/" },
        { text: "Tile Library", icon: <ListIcon />, path: "/tile-library" },
        {
            text: "Dashboard Library",
            icon: <RecentActorsIcon />,
            path: "/dashboard-library",
        },
        { text: "Settings", icon: <SettingsIcon />, path: "/settings" },
    ];

    const handleClickAway = () => {
        if (open) {
            // setOpen(false);
        }
    };

    const handleMenuItemClick = (path: string) => {
        navigate(path);
        setOpen(false);
    };

    return (
        <ClickAwayListener onClickAway={handleClickAway}>
            <StyledDrawer
                sx={{
                    flexShrink: 0,
                    "& .MuiDrawer-paper": {
                        width: drawerWidth,
                        boxSizing: "border-box",
                        backgroundColor: theme.palette.background.default,
                        color: theme.palette.text.primary,
                    },
                }}
                variant="persistent"
                anchor="left"
                open={open}
            >
                <DrawerHeader>
                    <IconButton onClick={() => setOpen(false)}>
                        <ChevronLeftIcon />
                    </IconButton>
                </DrawerHeader>
                <List>
                    {menuItems.map((item) => (
                        <StyledListItem
                            key={item.text}
                            onClick={() => handleMenuItemClick(item.path)}
                            selected={location.pathname === item.path}
                            sx={{ cursor: "pointer" }}
                        >
                            <ListItemIcon>{item.icon}</ListItemIcon>
                            <ListItemText primary={item.text} />
                        </StyledListItem>
                    ))}
                </List>
            </StyledDrawer>
        </ClickAwayListener>
    );
};

const DrawerHeader = styled("div")(({ theme }) => ({
    display: "flex",
    alignItems: "center",
    height: 50,
    justifyContent: "flex-end",
    paddingRight: theme.spacing(1),
}));

const StyledDrawer = styled(Drawer)(({ theme }) => ({
    "& .MuiDrawer-paper": {
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
    },
}));

const StyledListItem = styled(ListItem)<{ selected?: boolean }>(
    ({ theme, selected }) => ({
        "&:hover": {
            backgroundColor: theme.palette.action.hover,
        },
        backgroundColor: selected ? theme.palette.background.paper : "none",
        "&.Mui-selected": {
            backgroundColor: theme.palette.background.paper,
            "&:hover": {
                backgroundColor: theme.palette.action.selected,
            },
        },
    })
);

export default CustomDrawer;
