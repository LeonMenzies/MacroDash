import { useState, useEffect } from "react";
import { styled } from "@mui/material/styles";
import { TileT } from "types/ApiTypes";
import useFetchApi from "hooks/useFetchApi";
import { Loading } from "components/display/Loading";
import TileList from "pages/tile_store/TileList";
import { NavContainer } from "components/nav/NavContainer";
import {
    Box,
    MenuItem,
    FormControl,
    InputLabel,
    Select as MuiSelect,
    IconButton,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { useSetRecoilState } from "recoil";
import { navAtom } from "recoil/nav";

/* eslint-disable-next-line */
export interface TileStoreContainerProps {}

export function TileStoreContainer(props: TileStoreContainerProps) {
    const [sortBy, setSortBy] = useState<string>("title");
    const [sortOrder, setSortOrder] = useState<string>("asc");
    const [ownedFilter, setOwnedFilter] = useState<string | null>(null);
    const [fetchTilesListResponse, fetchTilesListLoading, fetchTilesList] =
        useFetchApi<TileT[]>(`/tiles/list`);
    const [tilesList, setTilesList] = useState<TileT[]>([]);
    const setOpen = useSetRecoilState(navAtom);

    useEffect(() => {
        fetchTilesList({
            sort_by: sortBy,
            sort_order: sortOrder,
            owned: ownedFilter,
        });
    }, [fetchTilesList, sortBy, sortOrder, ownedFilter]);

    useEffect(() => {
        if (fetchTilesListResponse.success && fetchTilesListResponse.data) {
            setTilesList(fetchTilesListResponse.data);
        }
    }, [fetchTilesListResponse]);

    return (
        <NavContainer>
            <StyledTileStoreContainer>
                <Box sx={{ p: "10px 0 10px 16px" }}>
                    <IconButton
                        aria-label="open drawer"
                        onClick={() => setOpen(true)}
                        edge="start"
                    >
                        <MenuIcon />
                    </IconButton>
                </Box>
                <Filters>
                    <FormControl variant="outlined" fullWidth>
                        <InputLabel>Sort By</InputLabel>
                        <MuiSelect
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            label="Sort By"
                        >
                            <MenuItem value="title">Title</MenuItem>
                            <MenuItem value="created_at">Created At</MenuItem>
                            <MenuItem value="updated_at">Updated At</MenuItem>
                        </MuiSelect>
                    </FormControl>
                    <FormControl variant="outlined" fullWidth>
                        <InputLabel>Sort Order</InputLabel>
                        <MuiSelect
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value)}
                            label="Sort Order"
                        >
                            <MenuItem value="asc">Ascending</MenuItem>
                            <MenuItem value="desc">Descending</MenuItem>
                        </MuiSelect>
                    </FormControl>
                    <FormControl variant="outlined" fullWidth>
                        <InputLabel>Owned</InputLabel>
                        <MuiSelect
                            value={ownedFilter || ""}
                            onChange={(e) =>
                                setOwnedFilter(e.target.value || null)
                            }
                            label="Owned"
                        >
                            <MenuItem value="">All</MenuItem>
                            <MenuItem value="true">Owned</MenuItem>
                            <MenuItem value="false">Not Owned</MenuItem>
                        </MuiSelect>
                    </FormControl>
                </Filters>
                <Loading show={fetchTilesListLoading} />
                <TileList tiles={tilesList} />
            </StyledTileStoreContainer>
        </NavContainer>
    );
}

export default TileStoreContainer;

const StyledTileStoreContainer = styled(Box)(({ theme }) => ({
    color: theme.palette.text.primary,
    margin: "5px 20px 20px 20px",
}));

const Filters = styled(Box)(({ theme }) => ({
    display: "flex",
    gap: theme.spacing(2),
    marginBottom: theme.spacing(3),
}));
