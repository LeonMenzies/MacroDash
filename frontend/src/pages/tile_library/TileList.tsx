import React from "react";
import { styled } from "@mui/material/styles";
import { TileT } from "types/ApiTypes";
import TileItem from "pages/tile_library/TileItem";
import { Box } from "@mui/material";

interface TileListProps {
    tiles: TileT[];
}

const TileList: React.FC<TileListProps> = ({ tiles }) => {
    return (
        <TilesList>
            {tiles.map((tile) => (
                <TileItem key={tile.id} tile={tile} />
            ))}
        </TilesList>
    );
};

export default TileList;

const TilesList = styled(Box)(({ theme }) => ({
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(2),
    overflowY: "auto",
    paddingTop: theme.spacing(2),
    height: "700px",
}));
