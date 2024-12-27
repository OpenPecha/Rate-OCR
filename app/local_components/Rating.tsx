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
    <div className="flex flex-col items-center space-y-2 sm:flex-row sm:items-center sm:space-x-4 sm:space-y-0">
      <span className="text-blue-500 text-sm sm:text-base text-center sm:text-left">Rating</span>
      <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
        <button
          key={rating}
          className={`w-8 h-8 text-sm sm:text-base sm:w-10 sm:h-10 border rounded ${
            value === rating ? "bg-blue-500 text-white" : "bg-white"
          }`}
          onClick={() => handleClick(rating)}
          disabled={disabled}
        >
          {rating}
        </button>
      ))}
    </div>
    </div>
  );
}
