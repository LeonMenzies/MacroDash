import React, { useState } from "react";
import { MenuItem, Menu, IconButton } from "@mui/material";
import styled from "styled-components";
import AddIcon from "@mui/icons-material/Add";

interface DashboardToolbarProps {
    filteredOwnedTiles: { title: string; tile_id: string }[];
    handleTileSelect: (tileId: string) => void;
}

export const DashboardToolbar = (props: DashboardToolbarProps) => {
    const { filteredOwnedTiles, handleTileSelect } = props;
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    return (
        <StyledToolbar>
            {filteredOwnedTiles.length > 0 && (
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
                {filteredOwnedTiles.map((item, index) => (
                    <MenuItem
                        key={index}
                        onClick={() => handleTileSelect(item.tile_id)}
                    >
                        {item.title}
                    </MenuItem>
                ))}
            </Menu>
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
