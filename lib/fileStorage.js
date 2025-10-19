import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Ensure this module only runs on the server
if (typeof window !== 'undefined') {
  throw new Error('fileStorage.js can only be used on the server side')
}

const UPLOAD_DIR = process.env.UPLOAD_DIR || './public/uploads'

// Ensure upload directory exists
export function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true })
  }
}

// Generate unique filename
export function generateUniqueFilename(originalName) {
  const timestamp = Date.now()
  const ext = path.extname(originalName)
  const name = path.basename(originalName, ext)
  return `${timestamp}-${name}${ext}`
}

// Save file to filesystem
export function saveFile(file, filename) {
  ensureUploadDir()
  const filepath = path.join(UPLOAD_DIR, filename)
  fs.writeFileSync(filepath, file)
  return filepath
}

// Delete file from filesystem
export function deleteFile(filename) {
  const filepath = path.join(UPLOAD_DIR, filename)
  if (fs.existsSync(filepath)) {
    fs.unlinkSync(filepath)
    return true
  }
  return false
}

// Format file size
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Get file type from filename
export function getFileType(filename) {
  const ext = path.extname(filename).toLowerCase()
  const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']
  const videoExts = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm']
  const audioExts = ['.mp3', '.wav', '.flac', '.aac', '.ogg']
  const docExts = ['.pdf', '.doc', '.docx', '.txt', '.rtf']
  
  if (imageExts.includes(ext)) return 'image'
  if (videoExts.includes(ext)) return 'video'
  if (audioExts.includes(ext)) return 'audio'
  if (docExts.includes(ext)) return 'document'
  
  return 'other'
}
