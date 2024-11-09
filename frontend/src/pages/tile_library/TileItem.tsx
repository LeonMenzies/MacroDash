import React, { useEffect, useState } from "react";
import { styled } from "@mui/material/styles";
import { TileT } from "types/ApiTypes";
import usePostApi from "hooks/usePostApi";
import { Box, Typography, Button } from "@mui/material";

interface TileItemProps {
    tile: TileT;
}

const TileItem: React.FC<TileItemProps> = ({ tile }) => {
    const [errorMessage, setErrorMessage] = useState<string>("");
    const [successMessage, setSuccessMessage] = useState<string>("");
    const [postResponse, postLoading, postTile] = usePostApi<
        { tile_id: number },
        void
    >("/tiles/user/add");

    const handleBuyTile = () => {
        setErrorMessage("");
        setSuccessMessage("");
        postTile({ tile_id: tile.id });
    };

    useEffect(() => {
        if (postResponse.success) {
            setSuccessMessage("Tile added to your list!");
        } else if (postResponse.errorMessage) {
            setErrorMessage(postResponse.errorMessage);
        }
    }, [postResponse]);

    return (
        <TileItemContainer>
            <Typography variant="h6">{tile.title}</Typography>
            <Typography variant="body2">{tile.description}</Typography>
            <Typography variant="body2">Type: {tile.tile_type}</Typography>
            <Typography variant="body2">State: {tile.state}</Typography>
            <Button
                onClick={handleBuyTile}
                disabled={postLoading || tile.owned}
                sx={{
                    backgroundColor: tile.owned ? "inherit" : "primary.main",
                    color: tile.owned ? "inherit" : "primary.contrastText",
                    padding: 1,
                    paddingX: 3,
                    borderRadius: "5px",
                    fontSize: "1rem",
                    transition: "background-color 0.2s",
                    "&:hover": {
                        backgroundColor: "primary.dark",
                    },
                    "&:disabled": {
                        backgroundColor: "action.disabledBackground",
                        color: "action.disabled",
                    },
                }}
            >
                {tile.owned ? "Owned" : postLoading ? "Processing..." : "Add"}
            </Button>
            {errorMessage && <Message error>{errorMessage}</Message>}
            {successMessage && <Message>{successMessage}</Message>}
        </TileItemContainer>
    );
};

export default TileItem;

const TileItemContainer = styled(Box)(({ theme }) => ({
    background: theme.palette.background.paper,
    padding: theme.spacing(3),
    borderRadius: theme.customBorders.radius,
    boxShadow: theme.customShadows[theme.palette.mode],
    marginBottom: theme.spacing(1),
    transition: "transform 0.2s",
    "&:hover": {
        transform: "translateY(-5px)",
    },
}));

const Message = styled(Typography)<{ error?: boolean }>(({ theme, error }) => ({
    color: error ? theme.palette.error.main : theme.palette.success.main,
    fontWeight: "bold",
    marginTop: theme.spacing(2),
}));
