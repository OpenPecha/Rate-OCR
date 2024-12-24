import React from "react";
import { Button } from "~/components/ui/button";

type ButtonProps = {
  label: string;
  onClick: () => void;
  type?: "button" | "submit" | "reset"; 
};

export default function Buttons({ label, onClick, type = "button" }: ButtonProps) {
  return (
    <Button
      className="px-4 py-2 border border-blue-500 bg-blue-500 text-white rounded"
      onClick={onClick}
      type={type} 
    >
      {label}
    </Button>
  );
}