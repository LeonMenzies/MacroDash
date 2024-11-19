import { useState, useEffect } from "react";
import {
    Mosaic,
    MosaicNode,
    getLeaves,
    createBalancedTreeFromLeaves,
    getPathToCorner,
    getNodeAtPath,
    getOtherDirection,
    updateTree,
    Corner,
    MosaicDirection,
    MosaicParent,
} from "react-mosaic-component";
import styled from "styled-components";
import useFetchApi from "hooks/useFetchApi";
import usePostApi from "hooks/usePostApi";
import { DashboardTileMap } from "pages/home/DashboardTileMap";
import { DashboardT, TileT } from "types/ApiTypes";
import dropRight from "lodash/dropRight";
import { DashboardTile } from "pages/home/DashboardTile";
import { NavContainer } from "components/nav/NavContainer";
import { DashboardHeader } from "pages/home/DashboardHeader";
import { DashboardAddModal } from "pages/home/DashboardAddModal";
import { Loading } from "components/display/Loading";

import "react-mosaic-component/react-mosaic-component.css";

/* eslint-disable-next-line */
export interface DashboardContainerProps {}

export const DashboardContainer = (props: DashboardContainerProps) => {
    const [mosaicValue, setMosaicValue] = useState<MosaicNode<string> | null>(
        null
    );
    const [ownedTiles, setOwnedTiles] = useState<TileT[]>([]);
    const [selectedDashboard, setSelectedDashboard] =
        useState<DashboardT | null>(null);
    const [fetchOwnedTilesResponse, , fetchOwnedTiles] =
        useFetchApi<TileT[]>(`/tiles/user/list`);
    const [updateDashboardResponse, , updateDashboard] =
        usePostApi(`/dashboard/update`);
    const [fetchDashboardsResponse, fetchDashboardsLoading, fetchDashboards] =
        useFetchApi<DashboardT[]>(`/dashboard/list`);
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [canEdit, setCanEdit] = useState(false);

    useEffect(() => {
        fetchOwnedTiles();
        fetchDashboards();
    }, [fetchOwnedTiles, fetchDashboards]);

    useEffect(() => {
        if (fetchOwnedTilesResponse.success && fetchOwnedTilesResponse.data) {
            setOwnedTiles(fetchOwnedTilesResponse.data);
        }
    }, [fetchOwnedTilesResponse]);

    const autoArrange = () => {
        const leaves = getLeaves(mosaicValue);
        setMosaicValue(createBalancedTreeFromLeaves(leaves));
    };

    useEffect(() => {
        if (selectedDashboard) {
            setMosaicValue(selectedDashboard.config);
        }
    }, [selectedDashboard]);

    const handleTileSelect = (tileId: string) => {
        let currentNode = mosaicValue;

        if (currentNode) {
            const path = getPathToCorner(currentNode, Corner.TOP_RIGHT);
            const parent = getNodeAtPath(
                currentNode,
                dropRight(path)
            ) as MosaicParent<string>;
            const destination = getNodeAtPath(
                currentNode,
                path
            ) as MosaicNode<string>;
            const direction: MosaicDirection = parent
                ? getOtherDirection(parent.direction)
                : "row";

            let first: MosaicNode<string>;
            let second: MosaicNode<string>;
            if (direction === "row") {
                first = destination;
                second = tileId;
            } else {
                first = tileId;
                second = destination;
            }

            currentNode = updateTree(currentNode, [
                {
                    path,
                    spec: {
                        $set: {
                            direction,
                            first,
                            second,
                        },
                    },
                },
            ]);
        } else {
            currentNode = tileId;
        }

        if (selectedDashboard) {
            updateDashboard({
                id: selectedDashboard.id,
                config: currentNode,
            });
        }
        setMosaicValue(currentNode);
    };

    const handleUpdatedDashboard = () => {
        if (selectedDashboard) {
            updateDashboard({
                id: selectedDashboard.id,
                config: mosaicValue,
            });
        }
    };

    const handleRemoveTile = (id: string) => {
        const removeTileFromTree = (
            node: MosaicNode<string> | null,
            tileId: string
        ): MosaicNode<string> | null => {
            if (!node) return null;
            if (typeof node === "string") return node === tileId ? null : node;

            const { direction, first, second } = node as MosaicParent<string>;
            const newFirst = removeTileFromTree(first, tileId);
            const newSecond = removeTileFromTree(second, tileId);

            if (!newFirst && !newSecond) return null;
            if (!newFirst) return newSecond;
            if (!newSecond) return newFirst;

            return { direction, first: newFirst, second: newSecond };
        };

        const newMosaicValue = removeTileFromTree(mosaicValue, id);
        setMosaicValue(newMosaicValue);
        if (selectedDashboard) {
            updateDashboard({
                id: selectedDashboard.id,
                config: newMosaicValue,
            });
        }
    };

    const getTileIdsInDashboard = (
        node: MosaicNode<string> | null
    ): string[] => {
        if (!node) return [];
        if (typeof node === "string") return [node];

        const { first, second } = node as MosaicParent<string>;
        return [
            ...getTileIdsInDashboard(first),
            ...getTileIdsInDashboard(second),
        ];
    };

    const tileIdsInDashboard = getTileIdsInDashboard(mosaicValue);
    const filteredOwnedTiles = ownedTiles.filter(
        (tile) => !tileIdsInDashboard.includes(tile.tile_id)
    );

    const menuItems = [
        {
            label: "Add tile to Top Right",
            onClick: () => {},
            subMenuItems: filteredOwnedTiles.map((tile) => ({
                label: tile.title,
                onClick: () => handleTileSelect(tile.tile_id),
            })),
        },
        { label: "Add New Dashboard", onClick: () => setAddModalOpen(true) },
        { label: "Edit Dashboard", onClick: () => setCanEdit(!canEdit) },
        { label: "Auto Arrange", onClick: autoArrange },
    ];

    return fetchDashboardsLoading ? (
        <Loading show={fetchDashboardsLoading} />
    ) : (
        <NavContainer>
            <StyledDashboardContainer>
                <DashboardHeader
                    menuItems={menuItems}
                    setSelectedDashboard={setSelectedDashboard}
                    fetchDashboardsResponse={fetchDashboardsResponse}
                    canEdit={canEdit}
                    setCanEdit={setCanEdit}
                />
                <DashboardAddModal
                    open={addModalOpen}
                    onClose={() => setAddModalOpen(false)}
                    ownedTiles={ownedTiles}
                />
                <Mosaic<string>
                    onRelease={handleUpdatedDashboard}
                    renderTile={(id, path) => {
                        const tileData = DashboardTileMap[id] || {
                            tile: <div>Tile Not Found</div>,
                            title: "Tile Not Found",
                            minimumHeight: 0,
                            minimumWidth: 0,
                        };
                        return (
                            <DashboardTile
                                id={id}
                                tile={tileData.tile}
                                title={tileData.title}
                                path={path}
                                canEdit={canEdit}
                                handleRemoveTile={handleRemoveTile}
                                updateDashboardResponse={
                                    updateDashboardResponse
                                }
                            />
                        );
                    }}
                    value={mosaicValue}
                    onChange={setMosaicValue}
                />
            </StyledDashboardContainer>
        </NavContainer>
    );
};

const StyledDashboardContainer = styled.div`
    height: 100%;

    .mosaic.mosaic-blueprint-theme {
        background: ${({ theme }) => theme.palette.background.default};
    }
`;
