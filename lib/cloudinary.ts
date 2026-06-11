export function getCloudinaryBaseUrl(resourceType: "image" | "video" = "image") {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  if (!cloudName) {
    return "";
  }

  return `https://res.cloudinary.com/${cloudName}/${resourceType}/upload`;
}

export function getCloudinaryAssetUrl(
  publicId: string,
  options?: {
    resourceType?: "image" | "video";
    transformation?: string;
  },
) {
  const resourceType = options?.resourceType ?? "image";
  const baseUrl = getCloudinaryBaseUrl(resourceType);
  const transformation = options?.transformation?.trim();

  if (!baseUrl) {
    return "";
  }

  return transformation
    ? `${baseUrl}/${transformation}/${publicId}`
    : `${baseUrl}/${publicId}`;
}

export function getAssetPreviewUrl(
  publicId: string,
  mediaType: string,
  transformation?: string,
) {
  return getCloudinaryAssetUrl(publicId, {
    resourceType: mediaType === "video" ? "video" : "image",
    transformation:
      transformation ??
      (mediaType === "video"
        ? "so_0,w_960,h_540,c_fill,q_auto,f_mp4"
        : "w_960,h_540,c_fill,q_auto,f_auto"),
  });
}

export function getAssetDownloadUrl(publicId: string, mediaType: string) {
  return getCloudinaryAssetUrl(publicId, {
    resourceType: mediaType === "video" ? "video" : "image",
    transformation: mediaType === "video" ? "q_auto,f_mp4,fl_attachment" : "q_auto,f_auto,fl_attachment",
  });
}

export function extractCloudinaryPublicId(imageUrl: string) {
  const uploadMarker = "/upload/";
  const uploadIndex = imageUrl.indexOf(uploadMarker);

  if (uploadIndex === -1) {
    return null;
  }

  const afterUpload = imageUrl.slice(uploadIndex + uploadMarker.length);
  const segments = afterUpload.split("/").filter(Boolean);
  const versionIndex = segments.findIndex((segment) => /^v\d+$/.test(segment));
  const publicIdSegments =
    versionIndex >= 0 ? segments.slice(versionIndex + 1) : segments.slice(-1);
  const publicId = publicIdSegments.join("/").replace(/\.[^.]+$/, "");

  return publicId || null;
}
