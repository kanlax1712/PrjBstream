"use client";

import Image from "next/image";
import { getAbsoluteThumbnailUrl } from "@/lib/thumbnail-url";

type ThumbnailImageProps = {
  src: string;
  alt: string;
  className?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
};

/**
 * Renders video thumbnail with absolute URL in Capacitor app so images load in Android WebView.
 */
export function ThumbnailImage({ src, alt, className, fill, width, height, sizes, priority }: ThumbnailImageProps) {
  const resolvedSrc = getAbsoluteThumbnailUrl(src);
  if (fill) {
    return (
      <Image
        src={resolvedSrc}
        alt={alt}
        fill
        sizes={sizes}
        className={className}
        priority={priority}
        unoptimized={resolvedSrc.startsWith("data:")}
      />
    );
  }
  return (
    <Image
      src={resolvedSrc}
      alt={alt}
      width={width ?? 640}
      height={height ?? 360}
      className={className}
      unoptimized={resolvedSrc.startsWith("data:")}
    />
  );
}
