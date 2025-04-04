import styled, { keyframes } from "styled-components";

export interface LoadingProps {
    show: boolean;
}

export const Loading = (props: LoadingProps) => {
    const { show } = props;
    if (!show) {
        return null;
    }

    return (
        <StyledLoading>
            <Spinner />
        </StyledLoading>
    );
};

const StyledLoading = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
`;

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const Spinner = styled.div`
    border: 16px solid #f3f3f3;
    border-top: 16px solid #3498db;
    border-radius: 50%;
    width: 120px;
    height: 120px;
    animation: ${spin} 2s linear infinite;
`;
