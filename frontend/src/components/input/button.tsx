import { MouseEventHandler } from "react";
import styled, { css } from "styled-components";

export interface ButtonProps {
    text: string;
    disabled?: boolean;
    loading?: boolean;
    onClick: MouseEventHandler<HTMLButtonElement> | undefined;
}

export function Button(props: ButtonProps) {
    const { text, disabled = false, loading = false, onClick } = props;
    return (
        <StyledButton disabled={disabled || loading} onClick={onClick}>
            {loading ? "Loading..." : text}
        </StyledButton>
    );
}

export default Button;

const StyledButton = styled.button`
    padding: 10px 20px;
    border-radius: 5px;
    margin: 5px;

    border: none;
    background-color: #414141;
    color: white;
    cursor: pointer;
    transition: background-color 0.3s ease;

    &:hover {
        background-color: #181818;
    }

    ${({ disabled }) =>
        disabled &&
        css`
            background-color: #606060;
            cursor: not-allowed;
        `}
`;
