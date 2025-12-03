
const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const crypto = require('crypto');

class FileService {
  constructor() {
    this.userDataPath = app.getPath('userData');
    this.imagesDir = path.join(this.userDataPath, 'images');
    
    // Ensure directory exists
    if (!fs.existsSync(this.imagesDir)) {
      fs.mkdirSync(this.imagesDir, { recursive: true });
    }
  }

  // Save Base64 image to disk and return filename
  async saveImage(base64Data) {
    try {
      // Remove header if present (e.g., "data:image/png;base64,")
      const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      
      if (!matches || matches.length !== 3) {
        throw new Error('Invalid base64 string');
      }

      const type = matches[1];
      const buffer = Buffer.from(matches[2], 'base64');
      
      // Generate unique filename based on content hash
      const hash = crypto.createHash('md5').update(buffer).digest('hex');
      const extension = type.split('/')[1] || 'png';
      const filename = `${hash}.${extension}`;
      const filePath = path.join(this.imagesDir, filename);

      // Write file if it doesn't exist
      if (!fs.existsSync(filePath)) {
        await fs.promises.writeFile(filePath, buffer);
      }

      return filename; // Return relative path (filename only)
    } catch (error) {
      console.error('FileService: Failed to save image', error);
      throw error;
    }
  }

  // Get full path for a filename
  getImagePath(filename) {
    return path.join(this.imagesDir, filename);
  }
  
  // Read image as Base64 (for display)
  async readImage(filename) {
      try {
          const filePath = path.join(this.imagesDir, filename);
          if (!fs.existsSync(filePath)) return null;
          
          const buffer = await fs.promises.readFile(filePath);
          const extension = path.extname(filename).slice(1);
          return `data:image/${extension};base64,${buffer.toString('base64')}`;
      } catch (error) {
          console.error(`FileService: Failed to read image ${filename}`, error);
          return null;
      }
  }

  // Delete specific files
  async deleteFiles(filenames) {
      try {
          if (!filenames || !Array.isArray(filenames)) return;
          
          for (const filename of filenames) {
              const filePath = path.join(this.imagesDir, filename);
              if (fs.existsSync(filePath)) {
                  await fs.promises.unlink(filePath);
              }
          }
          return true;
      } catch (error) {
          console.error('FileService: Failed to delete files', error);
          return false;
      }
  }

  // Clear all images (Deprecated for user action, useful for factory reset)
  async clearImages() {
      try {
          if (fs.existsSync(this.imagesDir)) {
              const files = await fs.promises.readdir(this.imagesDir);
              for (const file of files) {
                  await fs.promises.unlink(path.join(this.imagesDir, file));
              }
          }
          return true;
      } catch (error) {
          console.error('FileService: Failed to clear images', error);
          return false;
      }
  }
}

module.exports = new FileService();
