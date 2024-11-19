import React, { useState } from "react";
import { MenuItem, Menu, IconButton } from "@mui/material";
import styled from "styled-components";
import DoneIcon from "@mui/icons-material/Done";
import AddIcon from "@mui/icons-material/Add";

interface DashboardToolbarProps {
    menuItems: {
        label: string;
        onClick?: () => void;
        subMenuItems?: { label: string; onClick: () => void }[];
    }[];
    canEdit: boolean;
    setCanEdit: (canEdit: boolean) => void;
}

export const DashboardToolbar = (props: DashboardToolbarProps) => {
    const { menuItems, canEdit, setCanEdit } = props;
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [subMenuAnchorEl, setSubMenuAnchorEl] = useState<null | HTMLElement>(
        null
    );
    const [subMenuItems, setSubMenuItems] = useState<
        { label: string; onClick: () => void }[] | null
    >(null);

    const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSubMenuAnchorEl(null);
        setSubMenuItems(null);
    };

    const handleSubMenuClick = (
        event: React.MouseEvent<HTMLLIElement>,
        items: { label: string; onClick: () => void }[]
    ) => {
        setSubMenuAnchorEl(event.currentTarget);
        setSubMenuItems(items);
    };

    return (
        <StyledToolbar>
            {canEdit ? (
                <IconButton
                    color="inherit"
                    aria-label="open dashboard menu"
                    onClick={() => setCanEdit(false)}
                    edge="start"
                >
                    <DoneIcon />
                </IconButton>
            ) : (
                <IconButton
                    color="inherit"
                    aria-label="open dashboard menu"
                    onClick={handleMenuClick}
                    edge="start"
                >
                    <AddIcon />
                </IconButton>
            )}
            <Menu
                id="dashboard-menu"
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                MenuListProps={{
                    "aria-labelledby": "dashboard-menu-button",
                }}
            >
                {menuItems.map((item, index) =>
                    item.subMenuItems ? (
                        <MenuItem
                            key={index}
                            onClick={(event) =>
                                handleSubMenuClick(event, item.subMenuItems!)
                            }
                        >
                            {item.label}
                        </MenuItem>
                    ) : (
                        <MenuItem
                            key={index}
                            onClick={() => {
                                item.onClick?.();
                                handleMenuClose();
                            }}
                        >
                            {item.label}
                        </MenuItem>
                    )
                )}
            </Menu>
            {subMenuItems && (
                <Menu
                    id="sub-menu"
                    anchorEl={subMenuAnchorEl}
                    open={Boolean(subMenuAnchorEl)}
                    onClose={handleMenuClose}
                    MenuListProps={{
                        "aria-labelledby": "dashboard-menu-button",
                    }}
                >
                    {subMenuItems.map((subItem, subIndex) => (
                        <MenuItem
                            key={subIndex}
                            onClick={() => {
                                subItem.onClick();
                                handleMenuClose();
                            }}
                        >
                            {subItem.label}
                        </MenuItem>
                    ))}
                </Menu>
            )}
        </StyledToolbar>
    );
};

const StyledToolbar = styled.div`
    .add-tile-container {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    select {
        padding: 5px;
        font-size: 1rem;
    }
`;
