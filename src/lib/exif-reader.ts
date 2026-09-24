/**
 * Forensic EXIF & Metadata Inspector & Scrubber
 * Parses JPEG / PNG binary headers to detect GPS coordinates, camera models, and timestamps.
 */

export interface ExifReport {
  hasExif: boolean;
  fileSize: number;
  fileName: string;
  mimeType: string;
  cameraMake?: string;
  cameraModel?: string;
  software?: string;
  dateTime?: string;
  gps?: {
    latitude: number;
    longitude: number;
    altitude?: number;
    latRef?: string;
    lonRef?: string;
  };
  tagsFound: { name: string; value: string }[];
  threatLevel: 'NONE' | 'LOW' | 'HIGH';
}

/**
 * Extract EXIF metadata tags from an ArrayBuffer
 */
export function extractExifMetadata(buffer: ArrayBuffer, fileName: string, mimeType: string): ExifReport {
  const view = new DataView(buffer);
  const report: ExifReport = {
    hasExif: false,
    fileSize: buffer.byteLength,
    fileName,
    mimeType,
    tagsFound: [],
    threatLevel: 'NONE',
  };

  // Check for JPEG SOI marker (0xFFD8)
  if (view.byteLength < 4) return report;
  const isJpeg = view.getUint16(0, false) === 0xffd8;

  if (isJpeg) {
    let offset = 2;
    while (offset < view.byteLength - 4) {
      const marker = view.getUint16(offset, false);
      offset += 2;

      // APP1 Marker (0xFFE1) typically contains EXIF
      if (marker === 0xffe1) {
        report.hasExif = true;
        const length = view.getUint16(offset, false);
        offset += 2;

        // Check for 'Exif\0\0' string
        const exifHeader = String.fromCharCode(
          view.getUint8(offset),
          view.getUint8(offset + 1),
          view.getUint8(offset + 2),
          view.getUint8(offset + 3)
        );

        if (exifHeader === 'Exif') {
          parseTiff(view, offset + 6, report);
        }
        break;
      } else if ((marker & 0xff00) === 0xff00) {
        // Skip other markers
        const length = view.getUint16(offset, false);
        offset += length;
      } else {
        break;
      }
    }
  }

  // Determine Threat Level
  if (report.gps) {
    report.threatLevel = 'HIGH';
  } else if (report.cameraModel || report.tagsFound.length > 0) {
    report.threatLevel = 'LOW';
  }

  return report;
}

function parseTiff(view: DataView, tiffStart: number, report: ExifReport) {
  if (tiffStart + 8 > view.byteLength) return;
  const endianMarker = view.getUint16(tiffStart, false);
  const littleEndian = endianMarker === 0x4949; // 'II'

  const firstIfdOffset = view.getUint32(tiffStart + 4, littleEndian);
  if (tiffStart + firstIfdOffset + 2 > view.byteLength) return;

  const numEntries = view.getUint16(tiffStart + firstIfdOffset, littleEndian);
  let dirOffset = tiffStart + firstIfdOffset + 2;

  let gpsIfdOffset: number | null = null;

  for (let i = 0; i < numEntries; i++) {
    if (dirOffset + 12 > view.byteLength) break;
    const tag = view.getUint16(dirOffset, littleEndian);
    const type = view.getUint16(dirOffset + 2, littleEndian);
    const count = view.getUint32(dirOffset + 4, littleEndian);
    const valOffset = dirOffset + 8;

    if (tag === 0x010f) {
      // Make
      report.cameraMake = readString(view, tiffStart, valOffset, count, littleEndian);
      report.tagsFound.push({ name: 'Camera Manufacturer', value: report.cameraMake });
    } else if (tag === 0x0110) {
      // Model
      report.cameraModel = readString(view, tiffStart, valOffset, count, littleEndian);
      report.tagsFound.push({ name: 'Camera Model / Phone', value: report.cameraModel });
    } else if (tag === 0x0131) {
      // Software
      report.software = readString(view, tiffStart, valOffset, count, littleEndian);
      report.tagsFound.push({ name: 'Firmware / Software', value: report.software });
    } else if (tag === 0x0132) {
      // DateTime
      report.dateTime = readString(view, tiffStart, valOffset, count, littleEndian);
      report.tagsFound.push({ name: 'Capture Timestamp', value: report.dateTime });
    } else if (tag === 0x8825) {
      // GPS IFD Pointer
      gpsIfdOffset = view.getUint32(valOffset, littleEndian);
    }

    dirOffset += 12;
  }

  // Parse GPS IFD if present
  if (gpsIfdOffset !== null && tiffStart + gpsIfdOffset + 2 < view.byteLength) {
    const numGpsEntries = view.getUint16(tiffStart + gpsIfdOffset, littleEndian);
    let gpsDir = tiffStart + gpsIfdOffset + 2;

    let latDegrees: number[] = [];
    let lonDegrees: number[] = [];
    let latRef = 'N';
    let lonRef = 'E';

    for (let i = 0; i < numGpsEntries; i++) {
      if (gpsDir + 12 > view.byteLength) break;
      const tag = view.getUint16(gpsDir, littleEndian);
      const valOffset = gpsDir + 8;

      if (tag === 0x0001) {
        latRef = String.fromCharCode(view.getUint8(valOffset));
      } else if (tag === 0x0002) {
        latDegrees = readRationals(view, tiffStart, valOffset, littleEndian);
      } else if (tag === 0x0003) {
        lonRef = String.fromCharCode(view.getUint8(valOffset));
      } else if (tag === 0x0004) {
        lonDegrees = readRationals(view, tiffStart, valOffset, littleEndian);
      }

      gpsDir += 12;
    }

    if (latDegrees.length === 3 && lonDegrees.length === 3) {
      let lat = latDegrees[0] + latDegrees[1] / 60 + latDegrees[2] / 3600;
      let lon = lonDegrees[0] + lonDegrees[1] / 60 + lonDegrees[2] / 3600;
      if (latRef === 'S') lat = -lat;
      if (lonRef === 'W') lon = -lon;

      report.gps = {
        latitude: parseFloat(lat.toFixed(6)),
        longitude: parseFloat(lon.toFixed(6)),
        latRef,
        lonRef,
      };

      report.tagsFound.push({
        name: 'GPS Precise Coordinates',
        value: `${report.gps.latitude}°, ${report.gps.longitude}° (${latRef}, ${lonRef})`,
      });
    }
  }
}

function readString(
  view: DataView,
  tiffStart: number,
  offset: number,
  count: number,
  littleEndian: boolean
): string {
  let strOffset = count <= 4 ? offset : tiffStart + view.getUint32(offset, littleEndian);
  let str = '';
  for (let i = 0; i < count; i++) {
    if (strOffset + i >= view.byteLength) break;
    const charCode = view.getUint8(strOffset + i);
    if (charCode === 0) break;
    str += String.fromCharCode(charCode);
  }
  return str.trim();
}

function readRationals(view: DataView, tiffStart: number, offset: number, littleEndian: boolean): number[] {
  const targetOffset = tiffStart + view.getUint32(offset, littleEndian);
  const result: number[] = [];
  for (let i = 0; i < 3; i++) {
    const entry = targetOffset + i * 8;
    if (entry + 8 > view.byteLength) break;
    const num = view.getUint32(entry, littleEndian);
    const den = view.getUint32(entry + 4, littleEndian);
    result.push(den !== 0 ? num / den : 0);
  }
  return result;
}

/**
 * Deep cleans an image by redrawing to an offscreen HTML5 Canvas, completely stripping all EXIF and metadata.
 */
export async function scrubImageMetadata(file: File): Promise<{
  sanitizedFile: File;
  dataUrl: string;
  bytesSaved: number;
  originalSize: number;
  newSize: number;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Corrupt image data cannot be parsed.'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get 2D canvas context.'));
          return;
        }

        // Draw image raw pixels without any metadata
        ctx.drawImage(img, 0, 0);

        const targetMime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to generate sanitized image blob.'));
              return;
            }

            const cleanFileName = file.name.replace(/\.[^/.]+$/, '') + '_anonymized' + (targetMime === 'image/png' ? '.png' : '.jpg');
            const sanitizedFile = new File([blob], cleanFileName, { type: targetMime });
            const dataUrl = canvas.toDataURL(targetMime, 0.95);
            const bytesSaved = Math.max(0, file.size - blob.size);

            resolve({
              sanitizedFile,
              dataUrl,
              bytesSaved,
              originalSize: file.size,
              newSize: blob.size,
            });
          },
          targetMime,
          0.95
        );
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}
