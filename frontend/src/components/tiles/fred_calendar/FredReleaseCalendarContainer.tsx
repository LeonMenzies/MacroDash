import { useState, useEffect } from "react";
import { styled } from "@mui/system";
import { CalendarEventT } from "types/ApiTypes";
import useFetchApi from "hooks/useFetchApi";
import { CalendarList } from "components/tiles/fred_calendar/CalendarList";
import { Box, Skeleton } from "@mui/material";
import dayjs, { Dayjs } from "dayjs";
import CalendarFilter from "components/tiles/fred_calendar/CalendarFilter";

/* eslint-disable-next-line */
export interface FredReleaseCalendarContainerProps {}

export const FredReleaseCalendarContainer = (
    props: FredReleaseCalendarContainerProps
) => {
    const [sortBy, setSortBy] = useState<string>("date");
    const [sortOrder, setSortOrder] = useState<string>("desc");
    const [searchText, setSearchText] = useState<string>("");
    const [startDate, setStartDate] = useState<Dayjs | null>(
        dayjs().subtract(1, "year")
    );
    const [endDate, setEndDate] = useState<Dayjs | null>(dayjs());
    const [calendarList, setCalendarList] = useState<CalendarEventT[]>([]);
    const [
        fetchCalendarListResponse,
        fetchCalendarListLoading,
        fetchCalendarList,
    ] = useFetchApi<CalendarEventT[]>(`/fred-release-calendar`);

    useEffect(() => {
        fetchCalendarList();
    }, [startDate, endDate, fetchCalendarList]);

    useEffect(() => {
        if (
            fetchCalendarListResponse.success &&
            fetchCalendarListResponse.data
        ) {
            setCalendarList(fetchCalendarListResponse.data);
        }
    }, [fetchCalendarListResponse]);

    const filteredEvents = calendarList
        .filter((event) =>
            event.release_name.toLowerCase().includes(searchText.toLowerCase())
        )
        .sort((a, b) => {
            if (sortBy === "date") {
                return sortOrder === "asc"
                    ? new Date(a.release_date).getTime() -
                          new Date(b.release_date).getTime()
                    : new Date(b.release_date).getTime() -
                          new Date(a.release_date).getTime();
            } else {
                return sortOrder === "asc"
                    ? a.release_name.localeCompare(b.release_name)
                    : b.release_name.localeCompare(a.release_name);
            }
        });

    return fetchCalendarListLoading ? (
        <Skeleton variant="rectangular" width="100%" height="100%" />
    ) : (
        <StyledFredReleaseCalendarContainer>
            <CalendarFilter
                searchText={searchText}
                setSearchText={setSearchText}
                sortBy={sortBy}
                setSortBy={setSortBy}
                sortOrder={sortOrder}
                setSortOrder={setSortOrder}
                startDate={startDate}
                setStartDate={setStartDate}
                endDate={endDate}
                setEndDate={setEndDate}
            />
            <CalendarList events={filteredEvents} />
        </StyledFredReleaseCalendarContainer>
    );
};

const StyledFredReleaseCalendarContainer = styled(Box)(({ theme }) => ({
    padding: theme.spacing(2),
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
}));
