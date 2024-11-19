import { MosaicWindow, MosaicBranch } from "react-mosaic-component";
import { IconButton, Typography, Box, Paper, Alert } from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import styled from "styled-components";
import { useState, useEffect, useRef } from "react";
import { DashboardTileMap } from "pages/home/DashboardTileMap";

import "react-mosaic-component/react-mosaic-component.css";

/* eslint-disable-next-line */
export interface DashboardTileProps {
    id: string;
    tile: JSX.Element;
    title: string;
    path: MosaicBranch[];
    canEdit: boolean;
    handleRemoveTile: (id: string) => void;
    updateDashboardResponse: any;
}

export function DashboardTile(props: DashboardTileProps) {
    const {
        id,
        tile,
        title,
        path,
        canEdit,
        handleRemoveTile,
        updateDashboardResponse,
    } = props;
    const tileRef = useRef<HTMLDivElement>(null);
    const [isBelowMinDimensions, setIsBelowMinDimensions] = useState(false);
    const [isBelowMinWidth, setIsBelowMinWidth] = useState(false);
    const [isBelowMinHeight, setIsBelowMinHeight] = useState(false);

    const minWidth = DashboardTileMap[id]?.minimumWidth || 0;
    const minHeight = DashboardTileMap[id]?.minimumHeight || 0;

    useEffect(() => {
        const checkDimensions = () => {
            if (tileRef.current) {
                const { offsetWidth, offsetHeight } = tileRef.current;
                setIsBelowMinWidth(offsetWidth < minWidth);
                setIsBelowMinHeight(offsetHeight < minHeight);
                setIsBelowMinDimensions(
                    offsetWidth < minWidth || offsetHeight < minHeight
                );
            }
        };

        checkDimensions();
        window.addEventListener("resize", checkDimensions);
        return () => {
            window.removeEventListener("resize", checkDimensions);
        };
    }, [minWidth, minHeight, updateDashboardResponse]);

    return (
        <StyledMosaicWindow
            title={title}
            path={path}
            onDragEnd={() => console.log("drag end")}
            renderToolbar={() => (
                <div className="mosiac-toolbar-custom">
                    <StyledToolBar>
                        <Typography
                            variant="subtitle1"
                            noWrap
                            component="div"
                            sx={{ flexGrow: 1 }}
                        >
                            {title}
                        </Typography>
                        {canEdit && (
                            <IconButton
                                size="small"
                                onClick={() => handleRemoveTile(id)}
                                color="inherit"
                            >
                                <CloseIcon />
                            </IconButton>
                        )}
                    </StyledToolBar>
                </div>
            )}
        >
            <TileContainer
                ref={tileRef}
                $isBelowMinDimensions={isBelowMinDimensions}
            >
                {isBelowMinDimensions ? (
                    <ErrorOverlay>
                        <Paper elevation={3}>
                            <Alert severity="error">
                                {isBelowMinWidth && <div>Minimum Width</div>}
                                {isBelowMinHeight && <div>Minimum Height</div>}
                            </Alert>
                        </Paper>
                    </ErrorOverlay>
                ) : (
                    tile
                )}
            </TileContainer>
        </StyledMosaicWindow>
    );
}

const StyledMosaicWindow = styled(MosaicWindow)`
    .mosaic-window-body {
        box-shadow: ${({ theme }) => theme.customShadows.light};
        background: ${({ theme }) => theme.palette.background.paper} !important;
        background-color: ${({ theme }) => theme.palette.background.paper};
        color: ${({ theme }) => theme.palette.text.primary} !important;
        border: none;
    }

    .mosiac-toolbar-custom {
        background-color: ${({ theme }) => theme.palette.background.paper};
        padding: 3px;
        width: 100%;
    }
`;

const ErrorOverlay = styled(Box)`
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: ${({ theme }) => theme.palette.background.default};
    z-index: 1;
    pointer-events: none;
`;

const StyledToolBar = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding-left: ${({ theme }) => theme.spacing(1)};
    color: ${({ theme }) => theme.palette.text.primary};
`;

const TileContainer = styled.div<{ $isBelowMinDimensions: boolean }>`
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    position: relative;
    ${({ $isBelowMinDimensions }) =>
        $isBelowMinDimensions &&
        `
    & > ${ErrorOverlay} {
      display: flex;
    }
  `}
`;
