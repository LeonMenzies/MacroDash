import styled, { keyframes } from "styled-components";

export interface ErrorProps {
  errorMessage: string;
}

export function Error(props: ErrorProps) {
  const { errorMessage } = props;

  return errorMessage ? <StyledError>{errorMessage}</StyledError> : null;
}

export default Error;

const slideDown = keyframes`
  0% {
    opacity: 0;
    transform: translateY(-10px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
`;

const StyledError = styled.div`
  color: red;
  margin: 0 5px;
  font-size: 14px;
  animation: ${slideDown} 0.3s ease-out;
`;
