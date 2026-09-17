"use client";
import Cropper from "react-easy-crop";
import type { CropArea } from "@/lib/canvas";
export default function PhotoCropper({
  image,
  crop,
  zoom,
  rotation,
  onCropChange,
  onZoomChange,
  onComplete,
  onInteractionStart,
  onInteractionEnd,
}: {
  image: string;
  crop: { x: number; y: number };
  zoom: number;
  rotation: number;
  onCropChange: (v: { x: number; y: number }) => void;
  onZoomChange: (v: number) => void;
  onComplete: (v: CropArea) => void;
  onInteractionStart: () => void;
  onInteractionEnd: () => void;
}) {
  return (
    <Cropper
      image={image}
      crop={crop}
      zoom={zoom}
      rotation={rotation}
      aspect={1}
      onCropChange={onCropChange}
      onZoomChange={onZoomChange}
      onCropComplete={(_, pixels) => onComplete(pixels)}
      onInteractionStart={onInteractionStart}
      onInteractionEnd={onInteractionEnd}
      showGrid={false}
      restrictPosition={false}
      minZoom={1}
      maxZoom={3}
      objectFit="cover"
    />
  );
}
