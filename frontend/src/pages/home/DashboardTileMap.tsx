import React from "react";
import { FredReleaseCalendarContainer } from "components/tiles/fred_calendar/FredReleaseCalendarContainer";
import { StockTickerContainer } from "components/tiles/stock_ticker/StockTickerContainer";
import { WeatherForecastContainer } from "components/tiles/weather_forecast/WeatherForecastContainer";
import { NewsFeedContainer } from "components/tiles/news_feed/NewsFeedContainer";
import { ChatContainer } from "components/tiles/chat/ChatContainer";

export const DashboardTileMap: {
    [key: string]: {
        tile: JSX.Element;
        title: string;
        minimumWidth: number;
        minimumHeight: number;
    };
} = {
    fred_release_calendar: {
        tile: <FredReleaseCalendarContainer />,
        title: "FRED Release Calendar",
        minimumWidth: 400,
        minimumHeight: 400,
    },
    stock_ticker: {
        tile: <StockTickerContainer />,
        title: "Stock Ticker",
        minimumWidth: 250,
        minimumHeight: 2,
    },
    weather_forecast: {
        tile: <WeatherForecastContainer />,
        title: "Weather Forecast",
        minimumWidth: 250,
        minimumHeight: 2,
    },
    news_feed: {
        tile: <NewsFeedContainer />,
        title: "News Feed",
        minimumWidth: 250,
        minimumHeight: 2,
    },
    chat: {
        tile: <ChatContainer />,
        title: "Chat",
        minimumWidth: 250,
        minimumHeight: 300,
    },
};
