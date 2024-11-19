import {
    IconButton,
    Box,
    ToggleButton,
    ToggleButtonGroup,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import { styled } from "styled-components";
import { useSetRecoilState } from "recoil";
import { navAtom } from "recoil/nav";
import { DashboardToolbar } from "pages/home/DashboardToolbar";
import { useEffect, useState } from "react";
import { ApiResponse, DashboardT } from "types/ApiTypes";

interface DashboardHeaderProps {
    setSelectedDashboard: (selected: DashboardT) => void;
    fetchDashboardsResponse: ApiResponse<DashboardT[]>;
    menuItems: {
        label: string;
        onClick?: () => void;
        subMenuItems?: { label: string; onClick: () => void }[];
    }[];
    canEdit: boolean;
    setCanEdit: (canEdit: boolean) => void;
}

export const DashboardHeader = (props: DashboardHeaderProps) => {
    const {
        menuItems,
        setSelectedDashboard,
        fetchDashboardsResponse,
        canEdit,
        setCanEdit,
    } = props;
    const setOpen = useSetRecoilState(navAtom);
    const [dashboardList, setDashboardList] = useState<DashboardT[]>([]);
    const [currentDashboardIndex, setCurrentDashboardIndex] = useState(0);

    const handleDashboardChange = (index: number) => {
        const selected = dashboardList[index];
        if (selected) {
            setSelectedDashboard(selected);
        }
    };

    const handleNextDashboard = () => {
        setCurrentDashboardIndex((prevIndex) => {
            const newIndex = (prevIndex + 1) % dashboardList.length;
            handleDashboardChange(newIndex);
            return newIndex;
        });
    };

    const handlePreviousDashboard = () => {
        setCurrentDashboardIndex((prevIndex) => {
            const newIndex =
                (prevIndex - 1 + dashboardList.length) % dashboardList.length;
            handleDashboardChange(newIndex);
            return newIndex;
        });
    };

    useEffect(() => {
        if (fetchDashboardsResponse.success && fetchDashboardsResponse.data) {
            setDashboardList(fetchDashboardsResponse.data);
            if (fetchDashboardsResponse.data.length > 0) {
                const firstDashboard = fetchDashboardsResponse.data[0];
                setSelectedDashboard(firstDashboard);
            }
        }
    }, [fetchDashboardsResponse, setSelectedDashboard]);

    return (
        <StyledDashboardHeader>
            <IconButton
                color="inherit"
                aria-label="open drawer"
                onClick={() => setOpen(true)}
                edge="start"
            >
                <MenuIcon />
            </IconButton>
            <ToggleButtonGroup size="small">
                <ToggleButton
                    value="previous"
                    onClick={handlePreviousDashboard}
                    disabled={currentDashboardIndex === 0}
                >
                    <ArrowBackIosNewIcon />
                </ToggleButton>
                <ToggleButton value="current" disabled>
                    {dashboardList[currentDashboardIndex]?.name}
                </ToggleButton>
                <ToggleButton
                    value="next"
                    onClick={handleNextDashboard}
                    disabled={
                        currentDashboardIndex === dashboardList.length - 1
                    }
                >
                    <ArrowForwardIosIcon />
                </ToggleButton>
            </ToggleButtonGroup>
            <DashboardToolbar
                menuItems={menuItems}
                canEdit={canEdit}
                setCanEdit={setCanEdit}
            />
        </StyledDashboardHeader>
    );
};

const StyledDashboardHeader = styled(Box)`
    background-color: ${({ theme }) => theme.palette.background.default};
    color: ${({ theme }) => theme.palette.text.primary};
    height: 50px;
    padding: 0 16px;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
`;
