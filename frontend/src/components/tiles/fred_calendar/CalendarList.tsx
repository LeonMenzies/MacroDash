import React from "react";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button } from "@mui/material";
import { CalendarEventT } from "types/ApiTypes";
import styled from "styled-components";

interface CalendarListProps {
    events: CalendarEventT[];
}

export const CalendarList: React.FC<CalendarListProps> = ({ events }) => {
    const handleButtonClick = (releaseId: string) => {
        window.open(`https://fred.stlouisfed.org/release?rid=${releaseId}`, '_blank');
    };

    return (
        <StyledTableContainer>
            <Table stickyHeader>
                <TableHead>
                    <TableRow>
                        <TableCell sx={{ padding: '4px 8px', fontSize: '0.875rem' }}>Release Name</TableCell>
                        <TableCell sx={{ padding: '4px 8px', fontSize: '0.875rem' }}>Release Date</TableCell>
                        <TableCell sx={{ padding: '4px 8px', fontSize: '0.875rem' }}>Action</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {events.map(event => (
                        <TableRow key={event.id}>
                            <TableCell sx={{ padding: '10px 8px', fontSize: '0.875rem' }}>{event.release_name}</TableCell>
                            <TableCell sx={{ padding: '10px 8px', fontSize: '0.875rem' }}>{new Date(event.release_date).toLocaleDateString()}</TableCell>
                            <TableCell sx={{ padding: '10px 8px', fontSize: '0.875rem' }}>
                                <Button size="small" variant="contained" color="primary" onClick={() => handleButtonClick(event.release_id.toString())}>
                                    View
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </StyledTableContainer>
    );
};

const StyledTableContainer = styled(TableContainer)`
  overflow-y: auto;

  .MuiTableCell-stickyHeader {
    background-color: ${({ theme }) => theme.palette.background.paper};
  }
`;