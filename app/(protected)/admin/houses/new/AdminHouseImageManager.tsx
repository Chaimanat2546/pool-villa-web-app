"use client";

import { ImagePlus, Trash2, Upload } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { useEffect, useRef } from "react";
import type {
  AdminHouseImage,
  AdminHouseImageCategory,
} from "@/lib/houses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type PendingHouseImageDraft = {
  id: string;
  category: AdminHouseImageCategory;
  file: File;
  previewUrl: string;
  sortOrder: number;
};

type AdminHouseImageManagerProps = {
  existingImages: AdminHouseImage[];
  pendingImages: PendingHouseImageDraft[];
  deletedImageIds: string[];
  createDraftId: () => string;
  setPendingImages: Dispatch<SetStateAction<PendingHouseImageDraft[]>>;
  setDeletedImageIds: Dispatch<SetStateAction<string[]>>;
};

const HOUSE_IMAGE_CATEGORIES: AdminHouseImageCategory[] = [
  "cover",
  "exterior",
  "interior",
  "review",
  "kitchen",
  "bathroom",
  "bedroom",
];

const HOUSE_IMAGE_CATEGORY_LABELS: Record<AdminHouseImageCategory, string> = {
  cover: "รูปปก",
  exterior: "ภายนอก",
  interior: "ภายใน",
  review: "รีวิว",
  kitchen: "ห้องครัว",
  bathroom: "ห้องน้ำ",
  bedroom: "ห้องนอน",
};

const MULTI_IMAGE_CATEGORIES = HOUSE_IMAGE_CATEGORIES.filter(
  (category) => category !== "cover",
);

function formatHouseImageCategory(category: AdminHouseImageCategory) {
  return HOUSE_IMAGE_CATEGORY_LABELS[category];
}

function getImagesByCategory<T extends { category: AdminHouseImageCategory }>(
  images: T[],
  category: AdminHouseImageCategory,
) {
  return images.filter((image) => image.category === category);
}

export function AdminHouseImageManager({
  existingImages,
  pendingImages,
  deletedImageIds,
  createDraftId,
  setDeletedImageIds,
  setPendingImages,
}: AdminHouseImageManagerProps) {
  const pendingImagesRef = useRef(pendingImages);
  const visibleExistingImages = existingImages.filter(
    (image) => !deletedImageIds.includes(image.id),
  );

  useEffect(() => {
    pendingImagesRef.current = pendingImages;
  }, [pendingImages]);

  useEffect(() => {
    return () => {
      pendingImagesRef.current.forEach((image) =>
        URL.revokeObjectURL(image.previewUrl),
      );
    };
  }, []);

  function addFiles(category: AdminHouseImageCategory, files: FileList | null) {
    const selectedFiles = Array.from(files ?? []).filter((file) =>
      file.type.startsWith("image/"),
    );

    if (selectedFiles.length === 0) return;

    setPendingImages((current) => {
      const categoryOffset =
        getImagesByCategory(visibleExistingImages, category).length +
        getImagesByCategory(current, category).length;
      const nextImages = selectedFiles.map((file, index) => ({
        id: createDraftId(),
        category,
        file,
        previewUrl: URL.createObjectURL(file),
        sortOrder: categoryOffset + index,
      }));

      if (category !== "cover") {
        return [...current, ...nextImages];
      }

      current
        .filter((image) => image.category === "cover")
        .forEach((image) => URL.revokeObjectURL(image.previewUrl));

      const existingCover = visibleExistingImages.find(
        (image) => image.category === "cover",
      );

      if (existingCover) {
        setDeletedImageIds((deletedIds) =>
          deletedIds.includes(existingCover.id)
            ? deletedIds
            : [...deletedIds, existingCover.id],
        );
      }

      return [
        ...current.filter((image) => image.category !== "cover"),
        { ...nextImages[0], sortOrder: 0 },
      ];
    });
  }

  function removePendingImage(id: string) {
    setPendingImages((current) => {
      const removedImage = current.find((image) => image.id === id);

      if (removedImage) {
        URL.revokeObjectURL(removedImage.previewUrl);
      }

      return current.filter((image) => image.id !== id);
    });
  }

  function removeExistingImage(id: string) {
    setDeletedImageIds((current) =>
      current.includes(id) ? current : [...current, id],
    );
  }

  function restoreExistingImage(id: string) {
    setDeletedImageIds((current) => current.filter((imageId) => imageId !== id));
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <ImagePlus className="h-5 w-5 text-primary" aria-hidden />
          <h2 className="text-lg font-semibold text-card-foreground">
            รูปปก
          </h2>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
          <ImageGrid
            images={getImagesByCategory(visibleExistingImages, "cover")}
            pendingImages={getImagesByCategory(pendingImages, "cover")}
            emptyLabel="ยังไม่มีรูปปก"
            onRemoveExisting={removeExistingImage}
            onRemovePending={removePendingImage}
          />
          <UploadControl
            acceptMultiple={false}
            category="cover"
            label="เลือกรูปปก"
            onFilesSelected={addFiles}
          />
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-primary" aria-hidden />
          <h2 className="text-lg font-semibold text-card-foreground">
            รูปบริเวณบ้าน
          </h2>
        </div>

        <div className="mt-4 space-y-5">
          {MULTI_IMAGE_CATEGORIES.map((category) => (
            <div
              key={category}
              className="grid gap-4 border-t border-border pt-5 first:border-t-0 first:pt-0 lg:grid-cols-[minmax(0,1fr)_220px]"
            >
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">
                  {formatHouseImageCategory(category)}
                </h3>
                <ImageGrid
                  images={getImagesByCategory(visibleExistingImages, category)}
                  pendingImages={getImagesByCategory(pendingImages, category)}
                  emptyLabel={`ยังไม่มีรูป${formatHouseImageCategory(category)}`}
                  onRemoveExisting={removeExistingImage}
                  onRemovePending={removePendingImage}
                />
              </div>
              <UploadControl
                acceptMultiple
                category={category}
                label={`เพิ่มรูป${formatHouseImageCategory(category)}`}
                onFilesSelected={addFiles}
              />
            </div>
          ))}
        </div>
      </section>

      {deletedImageIds.length > 0 ? (
        <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-card-foreground">
            รูปที่รอลบ
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {existingImages
              .filter((image) => deletedImageIds.includes(image.id))
              .map((image) => (
                <Button
                  key={image.id}
                  type="button"
                  variant="outline"
                  onClick={() => restoreExistingImage(image.id)}
                >
                  คืนค่า {formatHouseImageCategory(image.category)}
                </Button>
              ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function UploadControl({
  acceptMultiple,
  category,
  label,
  onFilesSelected,
}: {
  acceptMultiple: boolean;
  category: AdminHouseImageCategory;
  label: string;
  onFilesSelected: (
    category: AdminHouseImageCategory,
    files: FileList | null,
  ) => void;
}) {
  const inputId = `house-image-${category}`;

  return (
    <div className="grid content-start gap-2">
      <Label htmlFor={inputId}>{label}</Label>
      <Input
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple={acceptMultiple}
        onChange={(event) => {
          onFilesSelected(category, event.target.files);
          event.target.value = "";
        }}
      />
    </div>
  );
}

function ImageGrid({
  emptyLabel,
  images,
  pendingImages,
  onRemoveExisting,
  onRemovePending,
}: {
  emptyLabel: string;
  images: AdminHouseImage[];
  pendingImages: PendingHouseImageDraft[];
  onRemoveExisting: (id: string) => void;
  onRemovePending: (id: string) => void;
}) {
  const hasImages = images.length > 0 || pendingImages.length > 0;

  if (!hasImages) {
    return (
      <div className="flex min-h-32 items-center rounded-md border border-dashed border-border bg-muted px-4 text-sm text-muted-foreground">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {images.map((image) => (
        <figure
          key={image.id}
          className="overflow-hidden rounded-md border border-border bg-background"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.publicUrl}
            alt={image.altText ?? ""}
            className="aspect-[4/3] w-full object-cover"
          />
          <figcaption className="flex min-h-12 items-center justify-between gap-2 px-3 py-2">
            <span className="truncate text-xs text-muted-foreground">
              {image.altText ?? image.storagePath}
            </span>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label="ลบรูป"
              onClick={() => onRemoveExisting(image.id)}
            >
              <Trash2 aria-hidden />
            </Button>
          </figcaption>
        </figure>
      ))}

      {pendingImages.map((image) => (
        <figure
          key={image.id}
          className="overflow-hidden rounded-md border border-primary/30 bg-primary/5"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.previewUrl}
            alt=""
            className="aspect-[4/3] w-full object-cover"
          />
          <figcaption className="flex min-h-12 items-center justify-between gap-2 px-3 py-2">
            <span className="truncate text-xs text-primary">
              {image.file.name}
            </span>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label="ลบรูป"
              onClick={() => onRemovePending(image.id)}
            >
              <Trash2 aria-hidden />
            </Button>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
