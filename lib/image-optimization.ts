const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;
const MAX_SOURCE_SIZE = 12 * 1024 * 1024;

type ImagePreset = {
  maxWidth: number;
  maxHeight: number;
  quality: number;
};

type LoadedImage = {
  source: CanvasImageSource;
  width: number;
  height: number;
  cleanup: () => void;
};

export type OptimizedImage = {
  file: File;
  width: number;
  height: number;
  originalSize: number;
  optimizedSize: number;
};

function getImagePreset(folder: string): ImagePreset {
  const normalizedFolder = folder.toLowerCase();

  if (normalizedFolder.includes("foto-mobile")) {
    return {
      maxWidth: 1200,
      maxHeight: 1200,
      quality: 0.86,
    };
  }

  if (normalizedFolder.includes("foto-desktop")) {
    return {
      maxWidth: 1920,
      maxHeight: 1440,
      quality: 0.84,
    };
  }

  if (
    normalizedFolder.includes("/logo") ||
    normalizedFolder.includes("marca-dagua")
  ) {
    return {
      maxWidth: 1400,
      maxHeight: 1400,
      quality: 0.9,
    };
  }

  if (normalizedFolder.startsWith("motos/")) {
    return {
      maxWidth: 1800,
      maxHeight: 1400,
      quality: 0.86,
    };
  }

  return {
    maxWidth: 1600,
    maxHeight: 1600,
    quality: 0.85,
  };
}

function calculateDimensions(
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number,
) {
  const scale = Math.min(1, maxWidth / width, maxHeight / height);

  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function loadImageWithElement(file: File): Promise<LoadedImage> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      resolve({
        source: image,
        width: image.naturalWidth,
        height: image.naturalHeight,
        cleanup: () => URL.revokeObjectURL(objectUrl),
      });
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Não foi possível ler esta imagem."));
    };

    image.src = objectUrl;
  });
}

async function loadImage(file: File): Promise<LoadedImage> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file, {
        imageOrientation: "from-image",
      });

      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        cleanup: () => bitmap.close(),
      };
    } catch {
      return loadImageWithElement(file);
    }
  }

  return loadImageWithElement(file);
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("O navegador não conseguiu otimizar a imagem."));
          return;
        }

        resolve(blob);
      },
      "image/webp",
      quality,
    );
  });
}

function drawImage(
  source: CanvasImageSource,
  width: number,
  height: number,
) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d", {
    alpha: true,
  });

  if (!context) {
    throw new Error("O navegador não conseguiu preparar a imagem.");
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.clearRect(0, 0, width, height);
  context.drawImage(source, 0, 0, width, height);

  return canvas;
}

async function createOptimizedBlob(
  source: CanvasImageSource,
  initialWidth: number,
  initialHeight: number,
  initialQuality: number,
) {
  let width = initialWidth;
  let height = initialHeight;
  let quality = initialQuality;
  let blob: Blob | null = null;

  for (let attempt = 0; attempt < 7; attempt += 1) {
    const canvas = drawImage(source, width, height);
    blob = await canvasToBlob(canvas, quality);

    if (blob.size <= MAX_UPLOAD_SIZE) {
      return {
        blob,
        width,
        height,
      };
    }

    if (quality > 0.58) {
      quality = Math.max(0.58, quality - 0.09);
      continue;
    }

    width = Math.max(600, Math.round(width * 0.82));
    height = Math.max(600, Math.round(height * 0.82));
    quality = Math.max(0.58, initialQuality - 0.12);
  }

  if (!blob || blob.size > MAX_UPLOAD_SIZE) {
    throw new Error(
      "Mesmo após a otimização, a imagem continuou maior que 5 MB.",
    );
  }

  return {
    blob,
    width,
    height,
  };
}

function createOptimizedFile(blob: Blob, originalName: string) {
  const baseName =
    originalName
      .replace(/\.[^/.]+$/, "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "imagem";

  return new File([blob], `${baseName}.webp`, {
    type: "image/webp",
    lastModified: Date.now(),
  });
}

export async function optimizeImageForUpload(
  file: File,
  folder: string,
): Promise<OptimizedImage> {
  if (file.size > MAX_SOURCE_SIZE) {
    throw new Error("A imagem original precisa ter no máximo 12 MB.");
  }

  const preset = getImagePreset(folder);
  const loadedImage = await loadImage(file);

  try {
    if (loadedImage.width <= 0 || loadedImage.height <= 0) {
      throw new Error("A imagem selecionada não possui dimensões válidas.");
    }

    const dimensions = calculateDimensions(
      loadedImage.width,
      loadedImage.height,
      preset.maxWidth,
      preset.maxHeight,
    );

    const result = await createOptimizedBlob(
      loadedImage.source,
      dimensions.width,
      dimensions.height,
      preset.quality,
    );

    const optimizedFile = createOptimizedFile(
      result.blob,
      file.name,
    );

    return {
      file: optimizedFile,
      width: result.width,
      height: result.height,
      originalSize: file.size,
      optimizedSize: optimizedFile.size,
    };
  } finally {
    loadedImage.cleanup();
  }
}
