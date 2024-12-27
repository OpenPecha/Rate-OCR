import React from "react";
import { Textarea } from "~/components/ui/textarea";
type TranscriptTextAreaProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
};

export default function TranscriptTextArea({
  value,
  onChange,
  placeholder,
  disabled = false,
}: TranscriptTextAreaProps) {
  return (
    <Textarea
      className="w-full max-w-4xl h-48 rounded-md border border-blue-300 p-2"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
    />
  );
}
