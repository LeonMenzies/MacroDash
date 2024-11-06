import { TextField, MenuItem, Select, FormControl, InputLabel, Box, styled } from "@mui/material";
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { Dayjs } from 'dayjs';

interface CalendarFilterProps {
    searchText: string;
    setSearchText: (text: string) => void;
    sortBy: string;
    setSortBy: (sortBy: string) => void;
    sortOrder: string;
    setSortOrder: (sortOrder: string) => void;
    startDate: Dayjs | null;
    setStartDate: (date: Dayjs | null) => void;
    endDate: Dayjs | null;
    setEndDate: (date: Dayjs | null) => void;
}

const CalendarFilter = ({
    searchText,
    setSearchText,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    startDate,
    setStartDate,
    endDate,
    setEndDate
}: CalendarFilterProps) => {
    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <StyledFilters>
                <TextField
                    size="small"
                    label="Search"
                    variant="outlined"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                />
                <DatePicker
                    sx={{ maxWidth: '150px' }}
                    label="Start Date"
                    slotProps={{ textField: { size: 'small' } }}
                    value={startDate}
                    onChange={(date) => setStartDate(date)}
                />
                <DatePicker
                    sx={{ maxWidth: '150px' }}
                    slotProps={{ textField: { size: 'small' } }}
                    label="End Date"
                    value={endDate}
                    onChange={(date) => setEndDate(date)}
                />
                <FormControl variant="outlined">
                    <InputLabel>Sort By</InputLabel>
                    <Select
                        size="small"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        label="Sort By"
                    >
                        <MenuItem value="date">Date</MenuItem>
                        <MenuItem value="name">Name</MenuItem>
                    </Select>
                </FormControl>
                <FormControl variant="outlined">
                    <InputLabel>Sort Order</InputLabel>
                    <Select
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value)}
                        label="Sort Order"
                        size="small"
                    >
                        <MenuItem value="asc">Ascending</MenuItem>
                        <MenuItem value="desc">Descending</MenuItem>
                    </Select>
                </FormControl>
            </StyledFilters>
        </LocalizationProvider>
    );
};

const StyledFilters = styled(Box)(({ theme }) => ({
    display: 'flex',
    gap: '10px',
    marginBottom: theme.spacing(2),
    flexWrap: 'wrap',
}));

export default CalendarFilter;