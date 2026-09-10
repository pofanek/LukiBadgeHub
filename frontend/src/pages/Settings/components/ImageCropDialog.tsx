import { useEffect, useMemo, useRef, useState } from "react";
import { FiMinus, FiPlus, FiX } from "react-icons/fi";

type ImageCropDialogProps = {
  file: File;
  kind: "avatar" | "banner";
  onCancel: () => void;
  onConfirm: (file: File) => Promise<void>;
};

const targets = {
  avatar: { width: 512, height: 512, label: "avatar" },
  banner: { width: 1500, height: 500, label: "banner" },
};

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("This image could not be read."));
    image.src = source;
  });
}

function ImageCropDialog({ file, kind, onCancel, onConfirm }: ImageCropDialogProps) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const target = targets[kind];
  const [source, setSource] = useState("");
  const previewRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; positionX: number; positionY: number } | null>(null);

  useEffect(() => {
    let isCurrent = true;
    const reader = new FileReader();
    reader.onerror = () => { if (isCurrent) setError("This image could not be read."); };
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : "";
      if (!isCurrent) return;
      if (!dataUrl) return setError("This image could not be read.");
      setSource(dataUrl);
      loadImage(dataUrl).then((loadedImage) => {
        if (!isCurrent) return;
        const baseScale = Math.max(target.width / loadedImage.naturalWidth, target.height / loadedImage.naturalHeight);
        setImage(loadedImage);
        setPosition({ x: (target.width - loadedImage.naturalWidth * baseScale) / 2, y: (target.height - loadedImage.naturalHeight * baseScale) / 2 });
      }).catch((reason) => { if (isCurrent) setError(reason.message); });
    };
    reader.readAsDataURL(file);
    return () => { isCurrent = false; reader.abort(); };
  }, [file, target.height, target.width]);

  const metrics = useMemo(() => {
    if (!image) return null;
    const baseScale = Math.max(target.width / image.naturalWidth, target.height / image.naturalHeight);
    const scale = baseScale * zoom;
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    return { width, height, x: Math.min(0, Math.max(target.width - width, position.x)), y: Math.min(0, Math.max(target.height - height, position.y)) };
  }, [image, position, target.height, target.width, zoom]);

  const clampPosition = (x: number, y: number) => ({ x: Math.min(0, Math.max(target.width - (metrics?.width || target.width), x)), y: Math.min(0, Math.max(target.height - (metrics?.height || target.height), y)) });
  const beginDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!metrics) return;
    event.preventDefault();
    dragRef.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, positionX: metrics.x, positionY: metrics.y };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const drag = (event: React.PointerEvent<HTMLDivElement>) => {
    const start = dragRef.current;
    const bounds = previewRef.current?.getBoundingClientRect();
    if (!start || start.pointerId !== event.pointerId || !bounds) return;
    setPosition(clampPosition(start.positionX + (event.clientX - start.startX) * (target.width / bounds.width), start.positionY + (event.clientY - start.startY) * (target.height / bounds.height)));
  };
  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const save = async () => {
    if (!image || !metrics) return;
    setSaving(true);
    setError("");
    const canvas = document.createElement("canvas");
    canvas.width = target.width;
    canvas.height = target.height;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.drawImage(image, metrics.x, metrics.y, metrics.width, metrics.height);
    canvas.toBlob(async (blob) => {
      if (!blob) { setError("The cropped image could not be created."); setSaving(false); return; }
      try {
        await onConfirm(new File([blob], `${target.label}.webp`, { type: "image/webp" }));
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "Image upload failed.");
        setSaving(false);
      }
    }, "image/webp", 0.9);
  };

  return (
    <div className="bg-surface-overlay/80 fixed inset-0 z-50 flex items-center justify-center p-3" role="dialog" aria-modal="true" aria-label={`Crop ${target.label}`}>
      <div className="border-border bg-surface-raised w-full max-w-2xl rounded-xl border p-4 shadow-black sm:p-6">
        <div className="flex items-start justify-between gap-4"><div><h2 className="text-font-primary font-serif text-2xl">Crop {kind}</h2><p className="text-font-muted mt-1 text-sm">Drag the image to position it, then zoom to frame it.</p></div><button type="button" onClick={onCancel} className="text-font-secondary hover:text-font-primary p-1" aria-label="Close crop editor"><FiX className="h-5 w-5" /></button></div>
        <div ref={previewRef} onPointerDown={beginDrag} onPointerMove={drag} onPointerUp={endDrag} onPointerCancel={endDrag} className="border-border bg-surface-overlay relative mx-auto mt-5 touch-none cursor-grab overflow-hidden border active:cursor-grabbing" style={{ aspectRatio: `${target.width}/${target.height}` }}>
          {metrics && <img src={source} alt="Crop preview" className="pointer-events-none absolute max-w-none select-none" style={{ width: `${(metrics.width / target.width) * 100}%`, height: `${(metrics.height / target.height) * 100}%`, left: `${(metrics.x / target.width) * 100}%`, top: `${(metrics.y / target.height) * 100}%` }} />}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-[auto_1fr_auto]"><button type="button" onClick={() => setZoom((value) => Math.max(1, value - 0.1))} className="border-border text-font-primary rounded-lg border p-2" aria-label="Zoom out"><FiMinus /></button><input aria-label="Crop zoom" type="range" min="1" max="2.5" step="0.05" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} className="accent-accent-cold" /><button type="button" onClick={() => setZoom((value) => Math.min(2.5, value + 0.1))} className="border-border text-font-primary rounded-lg border p-2" aria-label="Zoom in"><FiPlus /></button></div>
        {error && <p className="text-destructive mt-3 text-sm" role="alert">{error}</p>}
        <div className="mt-5 flex justify-end gap-3"><button type="button" onClick={onCancel} className="text-font-secondary hover:text-font-primary px-3 py-2 text-sm">Cancel</button><button type="button" onClick={save} disabled={!image || saving} className="bg-brand-secondary text-font-primary hover:bg-brand-primary rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-50">{saving ? "Saving…" : "Save image"}</button></div>
      </div>
    </div>
  );
}

export default ImageCropDialog;
