import React, { ChangeEvent } from "react";

interface TextAreaProps {
  className?: string;
  disabled?: boolean;
  value?: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  rows?: number;
}

const TextArea: React.FC<TextAreaProps> = ({
  className,
  disabled,
  onChange,
  rows,
  ...rest
}) => {
  return (
    <textarea
      className={`w-full p-1 mb-2 
        ${disabled ? "" : "border rounded"}
        ${className || ""}`}
      rows={rows || 2}
      onChange={onChange}
      {...rest}
    />
  );
};

export default TextArea;
