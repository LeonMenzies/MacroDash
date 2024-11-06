import { ChangeEventHandler } from 'react';
import styled from 'styled-components';

/* eslint-disable-next-line */
export interface TextAreaProps {
  title: string;
  placeholder?: string;
  value: string;
  required: boolean;
  id: string;
  onChange: ChangeEventHandler<HTMLTextAreaElement>;
}

export function TextArea(props: TextAreaProps) {
  const { title, placeholder, value, required, id, onChange } = props;
  return (
    <StyledTextArea>
      <label className={'text-input-label'} htmlFor={id}>
        {title}
      </label>
      <textarea
        rows={4}
        cols={50}
        className={'text-input'}
        id={id}
        placeholder={placeholder}
        onChange={onChange}
        value={value}
        required={required}
      />
    </StyledTextArea>
  );
}

export default TextArea;

const StyledTextArea = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0.2rem;
  margin: 0.2rem 0;
  background: #dbdbdb;

  .text-input-label {
    font-size: 1rem;
    padding: 0.1rem;
  }

  .text-input {
    padding: 0.1rem;
    font-size: 1rem;
    border-radius: 5px;
    border: none;
    background: none;
  }
  textarea:focus {
    outline: none;
  }
`;
