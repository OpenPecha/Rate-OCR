import React from "react";

type ImageBoxProps = {
  imageUrl: string;
};

export default function ImageBox({ imageUrl }: ImageBoxProps) {
  return (
    <div className="border p-1 sm:p-2 w-full max-w-4xl lg:max-w-5xl mx-auto">
      <img src={imageUrl} alt="OCR Preview" className="w-full h-auto object-contain min-h-[150px] md:min-h-[200px] lg:min-h-[250px]" />
    </div>
  );
}