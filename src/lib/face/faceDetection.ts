type Face = {
  boundingBox: { x: number; y: number; width: number; height: number };
};
type Detector = { detect: (source: CanvasImageSource) => Promise<Face[]> };
export async function loadFaceDetector(): Promise<Detector | null> {
  const Constructor = (
    window as unknown as {
      FaceDetector?: new (o: {
        fastMode: boolean;
        maxDetectedFaces: number;
      }) => Detector;
    }
  ).FaceDetector;
  return Constructor
    ? new Constructor({ fastMode: true, maxDetectedFaces: 1 })
    : null;
}
export async function detectPrimaryFace(image: HTMLImageElement) {
  try {
    const detector = await loadFaceDetector();
    return detector
      ? ((await detector.detect(image))[0]?.boundingBox ?? null)
      : null;
  } catch {
    return null;
  }
}
export function calculateSuggestedCrop(
  face: NonNullable<Awaited<ReturnType<typeof detectPrimaryFace>>>,
  width: number,
  height: number,
  displaySize: number,
) {
  const scale = displaySize / Math.min(width, height);
  return {
    x: (width / 2 - (face.x + face.width / 2)) * scale,
    y: (height / 2 - (face.y + face.height * 0.9)) * scale,
  };
}
