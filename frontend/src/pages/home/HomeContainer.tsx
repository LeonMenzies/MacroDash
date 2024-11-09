import { useState, useEffect } from "react";
import {
    Mosaic,
    MosaicNode,
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
import { DashboardTile } from "components/tiles/tile/DashboardTile";
import { NavContainer } from "components/nav/NavContainer";
import { HomeHeader } from "pages/home/HomeHeader";
import { Loading } from "components/display/Loading";

import "react-mosaic-component/react-mosaic-component.css";

/* eslint-disable-next-line */
export interface HomeContainerProps {}

export const HomeContainer = (props: HomeContainerProps) => {
    const [mosaicValue, setMosaicValue] = useState<MosaicNode<string> | null>(
        null
    );
    const [selectedDashboard, setSelectedDashboard] =
        useState<DashboardT | null>(null);
    const [fetchOwnedTilesResponse, , fetchOwnedTiles] =
        useFetchApi<TileT[]>(`/tiles/user/list`);
    const [updateDashboardResponse, , updateDashboard] =
        usePostApi(`/dashboard/update`);
    const [fetchDashboardsResponse, fetchDashboardsLoading, fetchDashboards] =
        useFetchApi<DashboardT[]>(`/dashboard/list`);
    const [canEdit, setCanEdit] = useState(true);

    useEffect(() => {
        fetchOwnedTiles();
        fetchDashboards();
    }, [fetchOwnedTiles, fetchDashboards]);

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

    return fetchDashboardsLoading ? (
        <Loading show={fetchDashboardsLoading} />
    ) : (
        <NavContainer>
            <StyledDashboardContainer>
                <HomeHeader
                    fetchOwnedTilesResponse={fetchOwnedTilesResponse}
                    fetchDashboardsResponse={fetchDashboardsResponse}
                    setSelectedDashboard={setSelectedDashboard}
                    handleTileSelect={handleTileSelect}
                    tileIdsInDashboard={tileIdsInDashboard}
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
