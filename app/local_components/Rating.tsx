import React from "react";

type RatingProps = {
  value: number | null;
  onChange: (value: number) => void;
  disabled?: boolean;
};

export default function Rating({ value, onChange, disabled = false }: RatingProps) {
  const handleClick = (rating: number) => {
    if (!disabled) {
      onChange(rating);
    }
  };
  return (
    <div className="flex items-center space-x-2">
      <span className="text-blue-500">Rating</span>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
        <button
          key={rating}
          className={`w-8 h-8 border rounded ${
            value === rating ? "bg-blue-500 text-white" : "bg-white"
          }`}
          onClick={() => handleClick(rating)}
          disabled={disabled}
        >
          {rating}
        </button>
      ))}
    </div>
  );
}
