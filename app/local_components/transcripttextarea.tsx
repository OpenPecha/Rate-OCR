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
    <div className="w-full max-w-4xl lg:max-w-5xl mx-auto">
    <Textarea
      className="w-full min-h-[200px] md:min-h-[250px] lg:min-h-[300px] rounded-md border border-blue-300 p-2 text-base md:text-lg lg:text-xl"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
    />
    </div>
  );
}
