import { useState, useEffect } from "react";
import { styled } from "@mui/material/styles";
import { DashboardT } from "types/ApiTypes";
import useFetchApi from "hooks/useFetchApi";
import usePostApi from "hooks/usePostApi";
import { Loading } from "components/display/Loading";
import { NavContainer } from "components/nav/NavContainer";
import {
    Box,
    IconButton,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import { useSetRecoilState } from "recoil";
import { navAtom } from "recoil/nav";

/* eslint-disable-next-line */
export interface DashboardLibraryContainerProps {}

export const DashboardLibraryContainer = (
    props: DashboardLibraryContainerProps
) => {
    const [dashboards, setDashboards] = useState<DashboardT[]>([]);
    const [selectedDashboard, setSelectedDashboard] =
        useState<DashboardT | null>(null);
    const [fetchDashboardsResponse, fetchDashboardsLoading, fetchDashboards] =
        useFetchApi<DashboardT[]>(`/dashboard/list`);
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [newDashboardTitle, setNewDashboardTitle] = useState("");
    const [, , updateDashboard] = usePostApi(`/dashboard/update`);
    const setOpen = useSetRecoilState(navAtom);

    useEffect(() => {
        fetchDashboards();
    }, [fetchDashboards]);

    useEffect(() => {
        if (fetchDashboardsResponse.success && fetchDashboardsResponse.data) {
            setDashboards(fetchDashboardsResponse.data);
        }
    }, [fetchDashboardsResponse]);

    const handleAddDashboard = () => {
        // Add logic to add a new dashboard
        setAddModalOpen(false);
    };

    const handleEditDashboard = () => {
        if (selectedDashboard) {
            updateDashboard({
                id: selectedDashboard.id,
                title: newDashboardTitle,
            });
        }
        setEditModalOpen(false);
    };

    return (
        <NavContainer>
            <StyledDashboardLibraryContainer>
                <Box
                    sx={{
                        p: "10px 0 10px 16px",
                        display: "flex",
                        justifyContent: "space-between",
                    }}
                >
                    <IconButton
                        aria-label="open drawer"
                        onClick={() => setOpen(true)}
                        edge="start"
                    >
                        <MenuIcon />
                    </IconButton>
                    <Box>
                        <IconButton
                            aria-label="add dashboard"
                            onClick={() => setAddModalOpen(true)}
                        >
                            <AddIcon />
                        </IconButton>
                        <IconButton
                            aria-label="edit dashboard"
                            onClick={() => setEditModalOpen(true)}
                        >
                            <EditIcon />
                        </IconButton>
                    </Box>
                </Box>
                <Loading show={fetchDashboardsLoading} />
                <DashboardList>
                    {dashboards.map((dashboard) => (
                        <DashboardItem key={dashboard.id}>
                            {dashboard.name}
                        </DashboardItem>
                    ))}
                </DashboardList>
                <Dialog
                    open={addModalOpen}
                    onClose={() => setAddModalOpen(false)}
                >
                    <DialogTitle>Add New Dashboard</DialogTitle>
                    <DialogContent>
                        <TextField
                            autoFocus
                            margin="dense"
                            label="Dashboard Title"
                            fullWidth
                            value={newDashboardTitle}
                            onChange={(e) =>
                                setNewDashboardTitle(e.target.value)
                            }
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setAddModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleAddDashboard}>Add</Button>
                    </DialogActions>
                </Dialog>
                <Dialog
                    open={editModalOpen}
                    onClose={() => setEditModalOpen(false)}
                >
                    <DialogTitle>Edit Dashboard</DialogTitle>
                    <DialogContent>
                        <TextField
                            autoFocus
                            margin="dense"
                            label="Dashboard Title"
                            fullWidth
                            value={newDashboardTitle}
                            onChange={(e) =>
                                setNewDashboardTitle(e.target.value)
                            }
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setEditModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleEditDashboard}>Save</Button>
                    </DialogActions>
                </Dialog>
            </StyledDashboardLibraryContainer>
        </NavContainer>
    );
};

const StyledDashboardLibraryContainer = styled(Box)(({ theme }) => ({
    color: theme.palette.text.primary,
    margin: "5px 20px 20px 20px",
}));

const DashboardList = styled(Box)(({ theme }) => ({
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(2),
    overflowY: "auto",
    paddingTop: theme.spacing(2),
    height: "700px",
}));

const DashboardItem = styled(Box)(({ theme }) => ({
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[1],
}));
