import multer from 'multer';

const imageTypes = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};
export function profileImageError(file) {
  if (!file) {
    return '';
  }
  if (!imageTypes[file.mimetype]) {
    return 'Choose a JPG, PNG, or WebP image.';
  }
  if (!file.size || file.size > 2 * 1024 * 1024) {
    return 'Profile images must be 2 MB or smaller.';
  }
  const buffer = file.buffer;
  const valid =
    buffer &&
    (file.mimetype === 'image/jpeg'
      ? buffer.length >= 4 &&
        buffer[0] === 0xff &&
        buffer[1] === 0xd8 &&
        buffer[2] === 0xff
      : file.mimetype === 'image/png'
        ? buffer.length >= 24 &&
          buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
        : buffer.length >= 16 &&
          buffer.toString('ascii', 0, 4) === 'RIFF' &&
          buffer.toString('ascii', 8, 12) === 'WEBP');
  return valid ? '' : 'This file is not a valid JPG, PNG, or WebP image.';
}
export const profileImageExtension = (file) => {
  return imageTypes[file.mimetype];
};
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 1, fields: 12, fieldSize: 4096 },
}).single('avatarFile');
export function receiveProfileImage(req, res, next) {
  upload(req, res, (error) => {
    const issue = error
      ? error.code === 'LIMIT_FILE_SIZE'
        ? 'Profile images must be 2 MB or smaller.'
        : 'Unable to upload this file. Choose one image up to 2 MB.'
      : profileImageError(req.file);
    if (issue) {
      return res.status(400).json({
        error: issue,
        fields: { avatar: issue },
      });
    }
    next();
  });
}
