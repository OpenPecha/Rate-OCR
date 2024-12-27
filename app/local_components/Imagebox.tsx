import React from "react";

type ImageBoxProps = {
  imageUrl: string;
};

export default function ImageBox({ imageUrl }: ImageBoxProps) {
  return (
    <div className="border p-4">
      <img src={imageUrl} alt="OCR Preview" className="w-full h-auto object-contain" />
    </div>
  );
}