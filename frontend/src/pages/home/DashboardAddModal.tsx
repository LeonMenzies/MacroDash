import React, { useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Checkbox,
    Divider,
} from "@mui/material";
import { TileT } from "types/ApiTypes";
import usePostApi from "hooks/usePostApi";
import useFetchApi from "hooks/useFetchApi";
import { MosaicNode } from "react-mosaic-component";
import { DashboardTileMap } from "./DashboardTileMap";

interface DashboardAddModalProps {
    open: boolean;
    onClose: () => void;
    ownedTiles: TileT[];
}

export const DashboardAddModal: React.FC<DashboardAddModalProps> = ({
    open,
    onClose,
    ownedTiles,
}) => {
    const [title, setTitle] = useState<string>("");
    const [checked, setChecked] = useState<string[]>([]);
    const [, , newDashboard] = usePostApi(`/dashboard/new`);
    const [, , fetchDashboards] =
        useFetchApi<{ id: number; name: string; config: MosaicNode<string> }[]>(
            `/dashboard/list`
        );

    const handleToggle = (tileId: string) => () => {
        const currentIndex = checked.indexOf(tileId);
        const newChecked = [...checked];

        if (currentIndex === -1) {
            newChecked.push(tileId);
        } else {
            newChecked.splice(currentIndex, 1);
        }

        setChecked(newChecked);
    };

    const handleSave = () => {
        const tileKeys = Object.keys(DashboardTileMap);
        const firstThreeTiles = tileKeys.slice(0, 3);

        const newConfig: MosaicNode<string> = {
            direction: "row",
            first: firstThreeTiles[0],
            second: {
                direction: "column",
                first: firstThreeTiles[1],
                second: firstThreeTiles[2],
            },
        };

        newDashboard({
            name: "New Dashboard",
            config: newConfig,
        }).then(() => {
            fetchDashboards();
        });

        setTitle("");
        setChecked([]);
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>Add New Dashboard</DialogTitle>
            <DialogContent>
                <Box mb={2}>
                    <TextField
                        label="Dashboard Title"
                        variant="outlined"
                        fullWidth
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                </Box>
                <Divider />
                <Box mt={2}>
                    <List>
                        {ownedTiles.map((tile) => (
                            <ListItem
                                key={tile.tile_id}
                                component="li"
                                onClick={handleToggle(tile.tile_id)}
                            >
                                <ListItemIcon>
                                    <Checkbox
                                        edge="start"
                                        checked={
                                            checked.indexOf(tile.tile_id) !== -1
                                        }
                                        tabIndex={-1}
                                        disableRipple
                                    />
                                </ListItemIcon>
                                <ListItemText primary={tile.title} />
                            </ListItem>
                        ))}
                    </List>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="secondary">
                    Cancel
                </Button>
                <Button
                    onClick={handleSave}
                    color="primary"
                    variant="contained"
                >
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    );
};
