import React, { ChangeEventHandler } from 'react';
import styled from 'styled-components';

interface SelectProps {
    title: string;
    value: string;
    options: { value: string; label: string }[];
    onChange: ChangeEventHandler<HTMLSelectElement>;
}

const Select: React.FC<SelectProps> = ({ title, value, options, onChange }) => {
    return (
        <StyledSelect>
            <label className="select-label" htmlFor={title}>
                {title}
            </label>
            <select className="select-input" id={title} value={value} onChange={onChange}>
                {options.map(option => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </StyledSelect>
    );
};

export default Select;

const StyledSelect = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0.2rem;
  margin: 0.2rem 0;
  background: #dbdbdb;

  .select-label {
    font-size: 1rem;
    padding: 0.1rem;
  }

  .select-input {
    padding: 0.1rem;
    font-size: 1rem;
    border-radius: 5px;
    border: none;
    background: none;
  }

  select:focus {
    outline: none;
  }
`;