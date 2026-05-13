"use client";

import { Images, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import type { HouseImage, HouseImageGroup } from "@/lib/houses";

type HouseImageGalleryProps = {
  houseId: string;
  coverImage: string | null;
  images: HouseImage[];
  imageGroups: HouseImageGroup[];
};

const ALL_ZONES_KEY = "__all__";

function getPreviewImages(images: HouseImage[]) {
  const previewImages: HouseImage[] = [];
  const usedZones = new Set<string>();
  const nonCoverImages = images.filter((image) => image.zone !== "cover");

  nonCoverImages.forEach((image) => {
    if (previewImages.length >= 4 || usedZones.has(image.zone)) return;

    previewImages.push(image);
    usedZones.add(image.zone);
  });

  nonCoverImages.forEach((image) => {
    if (previewImages.length >= 4 || previewImages.includes(image)) return;

    previewImages.push(image);
  });

  return previewImages;
}

function GalleryTile({
  src,
  alt,
  label,
  priority = false,
  className = "",
}: {
  src: string;
  alt: string;
  label?: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <div className={`relative overflow-hidden bg-stone-100 ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes="(max-width: 768px) 100vw, 50vw"
        className="object-cover"
      />
      {label && (
        <div className="absolute bottom-3 left-3 rounded-full bg-black/65 px-3 py-1 text-sm font-medium text-white backdrop-blur">
          {label}
        </div>
      )}
    </div>
  );
}

function ZoneTabButton({
  label,
  count,
  isActive,
  onClick,
}: {
  label: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
        isActive
          ? "bg-stone-950 text-white shadow-sm"
          : "bg-stone-100 text-stone-600 hover:bg-stone-200"
      }`}
    >
      {label}
      <span
        className={`text-xs ${isActive ? "text-stone-300" : "text-stone-400"}`}
      >
        {count}
      </span>
    </button>
  );
}

export function HouseImageGallery({
  houseId,
  coverImage,
  images,
  imageGroups,
}: HouseImageGalleryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeZone, setActiveZone] = useState(ALL_ZONES_KEY);
  const previewImages = useMemo(() => getPreviewImages(images), [images]);
  const primaryImage = coverImage ?? images[0]?.url ?? null;
  const totalImages = images.length + (coverImage ? 1 : 0);

  const zoneTabs = useMemo(() => {
    const tabs: { key: string; label: string; count: number }[] = [
      { key: ALL_ZONES_KEY, label: "ทั้งหมด", count: totalImages },
    ];

    imageGroups.forEach((group) => {
      tabs.push({
        key: group.zone,
        label: group.label,
        count: group.images.length,
      });
    });

    return tabs;
  }, [imageGroups, totalImages]);

  const filteredContent = useMemo(() => {
    if (activeZone === ALL_ZONES_KEY) {
      return { coverVisible: !!coverImage, groups: imageGroups };
    }

    if (activeZone === "cover_original") {
      return { coverVisible: !!coverImage, groups: [] };
    }

    return {
      coverVisible: false,
      groups: imageGroups.filter((group) => group.zone === activeZone),
    };
  }, [activeZone, coverImage, imageGroups]);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  if (!primaryImage) {
    return null;
  }

  return (
    <section className="mb-8">
      {/* --- Bento grid --- */}
      <div className="relative overflow-hidden rounded-xl border border-stone-200 bg-stone-100 shadow-sm">
        {/* Primary image: full width, tall */}
        <GalleryTile
          src={primaryImage}
          alt={`รูปปก DV-${houseId}`}
          priority
          className="aspect-[16/9] w-full md:aspect-[21/9]"
        />

        {/* Preview row: small thumbnails */}
        {previewImages.length > 0 && (
          <div className="grid grid-cols-4 border-t border-white/80">
            {previewImages.map((image) => (
              <GalleryTile
                key={`${image.zone}-${image.imageName}`}
                src={image.url}
                alt={`รูป ${image.zoneLabel} DV-${houseId}`}
                label={image.zoneLabel}
                className="aspect-[4/3] border-r border-white/80 last:border-r-0"
              />
            ))}
          </div>
        )}

        {totalImages > 1 && (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-stone-950 shadow-lg ring-1 ring-black/10 transition hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-950"
          >
            <Images className="h-4 w-4" aria-hidden="true" />
            ดูรูปทั้งหมด ({totalImages})
          </button>
        )}
      </div>

      {/* --- Full-screen modal --- */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={`รูปทั้งหมดของ DV-${houseId}`}
        >
          <div className="mx-auto max-w-6xl rounded-xl bg-white shadow-2xl">
            {/* Header */}
            <div className="sticky top-0 z-10 border-b border-stone-200 bg-white/95 px-5 pt-4 backdrop-blur">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-stone-950">
                    รูปทั้งหมด DV-{houseId}
                  </h2>
                  <p className="text-sm text-stone-600">
                    รวม {totalImages} รูป
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 text-stone-700 transition hover:bg-stone-100 focus:outline-none focus:ring-2 focus:ring-stone-950"
                  aria-label="ปิดหน้าต่างรูปทั้งหมด"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>

              {/* Zone tabs */}
              <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-4">
                {zoneTabs.map((tab) => (
                  <ZoneTabButton
                    key={tab.key}
                    label={tab.label}
                    count={tab.count}
                    isActive={activeZone === tab.key}
                    onClick={() => setActiveZone(tab.key)}
                  />
                ))}
              </div>
            </div>

            {/* Image grid */}
            <div className="space-y-8 p-5">
              {filteredContent.coverVisible && coverImage && (
                <section>
                  <div className="mb-3 flex items-end justify-between gap-3">
                    <h3 className="text-lg font-semibold text-stone-950">
                      รูปปกเดิม
                    </h3>
                    <span className="text-sm text-stone-500">1 รูป</span>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <GalleryTile
                      src={coverImage}
                      alt={`รูปปกเดิม DV-${houseId}`}
                      className="aspect-[4/3] rounded-lg"
                    />
                  </div>
                </section>
              )}

              {filteredContent.groups.map((group) => (
                <section key={group.zone}>
                  <div className="mb-3 flex items-end justify-between gap-3">
                    <h3 className="text-lg font-semibold text-stone-950">
                      {group.label}
                    </h3>
                    <span className="text-sm text-stone-500">
                      {group.images.length} รูป
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {group.images.map((image) => (
                      <GalleryTile
                        key={`${group.zone}-${image.imageName}`}
                        src={image.url}
                        alt={`รูป ${group.label} DV-${houseId}`}
                        className="aspect-[4/3] rounded-lg"
                      />
                    ))}
                  </div>
                </section>
              ))}

              {!filteredContent.coverVisible &&
                filteredContent.groups.length === 0 && (
                  <p className="py-12 text-center text-stone-400">
                    ไม่มีรูปในหมวดหมู่นี้
                  </p>
                )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
