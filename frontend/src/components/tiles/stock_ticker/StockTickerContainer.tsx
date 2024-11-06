import { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import Plot from "react-plotly.js";
import { Box, CircularProgress, useTheme } from "@mui/material";

/* eslint-disable-next-line */
export interface StockTickerContainerProps { }

const fakeTeslaData = {
    x: ["2023-01-01", "2023-01-02", "2023-01-03", "2023-01-04", "2023-01-05"],
    y: [700, 710, 720, 730, 740],
};

export const StockTickerContainer = (props: StockTickerContainerProps) => {
    const [teslaData, setTeslaData] = useState<{ x: string[], y: number[] } | null>(null);
    const [loading, setLoading] = useState(true);
    const theme = useTheme();
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    useEffect(() => {
        // Simulate fetching data
        setTimeout(() => {
            setTeslaData(fakeTeslaData);
            setLoading(false);
        }, 1000);
    }, []);

    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.offsetWidth,
                    height: containerRef.current.offsetHeight,
                });
            }
        };

        window.addEventListener('resize', handleResize);
        handleResize();

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return (
        <StyledStockTickerContainer ref={containerRef}>
            {loading ? (
                <CircularProgress />
            ) : (
                <Plot
                    data={[
                        {
                            x: teslaData?.x,
                            y: teslaData?.y,
                            type: 'scatter',
                            mode: 'lines+markers',
                            marker: { color: theme.palette.primary.main },
                        },
                    ]}
                    layout={{
                        paper_bgcolor: theme.palette.background.paper,
                        plot_bgcolor: theme.palette.background.default,
                        font: {
                            color: theme.palette.text.primary
                        },
                        autosize: true,
                        width: dimensions.width,
                        height: dimensions.height,
                    }}
                    style={{ width: '100%', height: '100%' }}
                    useResizeHandler
                />
            )}
        </StyledStockTickerContainer>
    );
}

const StyledStockTickerContainer = styled(Box)`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;