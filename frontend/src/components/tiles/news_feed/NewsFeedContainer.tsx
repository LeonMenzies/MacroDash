import { useState } from "react";
import { Tabs, Tab, Box, Typography } from "@mui/material";
import styled from "styled-components";

/* eslint-disable-next-line */
export interface NewsFeedContainerProps { }

const fakeNewsData = [
    {
        source: "Source 1",
        articles: [
            { title: "Stock Market News 1", description: "Description of stock market news 1." },
            { title: "Stock Market News 2", description: "Description of stock market news 2." },
        ],
    },
    {
        source: "Source 2",
        articles: [
            { title: "Finance News 1", description: "Description of finance news 1." },
            { title: "Finance News 2", description: "Description of finance news 2." },
        ],
    },
    {
        source: "Source 3",
        articles: [
            { title: "Market News 1", description: "Description of market news 1." },
            { title: "Market News 2", description: "Description of market news 2." },
        ],
    },
];

export const NewsFeedContainer = (props: NewsFeedContainerProps) => {
    const [activeTab, setActiveTab] = useState(0);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };

    return (
        <StyledNewsFeedContainer>
            <Tabs value={activeTab} onChange={handleTabChange} aria-label="news source tabs">
                {fakeNewsData.map((source, index) => (
                    <Tab key={index} label={source.source} />
                ))}
            </Tabs>
            <Box sx={{ padding: 2 }}>
                {fakeNewsData[activeTab].articles.map((article, index) => (
                    <Box key={index} sx={{ marginBottom: 2 }}>
                        <Typography variant="h6">{article.title}</Typography>
                        <Typography variant="body2">{article.description}</Typography>
                    </Box>
                ))}
            </Box>
        </StyledNewsFeedContainer>
    );
};

const StyledNewsFeedContainer = styled.div`
  padding: 20px;
`;