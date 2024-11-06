import styled from "styled-components";

/* eslint-disable-next-line */
export interface WeatherForecastContainerProps { }

export const WeatherForecastContainer = (props: WeatherForecastContainerProps) => {

    return (
        <StyledWeatherForecastContainer>
            Coming soon...
        </StyledWeatherForecastContainer>
    );
}

const StyledWeatherForecastContainer = styled.div`
  padding: 20px;
`;