import { NextResponse } from 'next/server'
import clientPromise from '../../../lib/mongodb'
import { saveFile, generateUniqueFilename, deleteFile } from '../../../lib/fileStorage'
import { ObjectId } from 'mongodb'

// GET /api/files - Fetch files (optionally filtered by folder)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const folderId = searchParams.get('folderId')
    
    const client = await clientPromise
    const db = client.db('filemanager')
    const collection = db.collection('files')
    
    const query = folderId ? { folderId } : {}
    const files = await collection.find(query).sort({ uploadedAt: -1 }).toArray()
    
    return NextResponse.json({ files })
  } catch (error) {
    console.error('Error fetching files:', error)
    return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 })
  }
}

// POST /api/files - Upload files
export async function POST(request) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files')
    const folderId = formData.get('folderId')
    
    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }
    
    const client = await clientPromise
    const db = client.db('filemanager')
    const collection = db.collection('files')
    
    const uploadedFiles = []
    
    for (const file of files) {
      if (file.size === 0) continue
      
      const filename = generateUniqueFilename(file.name)
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const filepath = saveFile(buffer, filename)
      
      const fileDoc = {
        name: file.name,
        filename: filename,
        size: file.size,
        type: file.type,
        folderId: folderId || null,
        uploadedAt: new Date(),
        path: `/uploads/${filename}`
      }
      
      const result = await collection.insertOne(fileDoc)
      uploadedFiles.push({ ...fileDoc, _id: result.insertedId })
    }
    
    return NextResponse.json({ files: uploadedFiles })
  } catch (error) {
    console.error('Error uploading files:', error)
    return NextResponse.json({ error: 'Failed to upload files' }, { status: 500 })
  }
}

// DELETE /api/files - Delete files
export async function DELETE(request) {
  try {
    const { fileIds } = await request.json()
    
    if (!fileIds || fileIds.length === 0) {
      return NextResponse.json({ error: 'No file IDs provided' }, { status: 400 })
    }
    
    // Convert string IDs to ObjectId instances
    const objectIds = fileIds.map(id => {
      try {
        return new ObjectId(id)
      } catch (error) {
        throw new Error(`Invalid file ID: ${id}`)
      }
    })
    
    const client = await clientPromise
    const db = client.db('filemanager')
    const collection = db.collection('files')
    
    // Get file info before deleting from database
    const files = await collection.find({ _id: { $in: objectIds } }).toArray()
    console.log(`Found ${files.length} files to delete:`, files.map(f => f.filename))
    
    if (files.length === 0) {
      return NextResponse.json({ error: 'No files found with provided IDs' }, { status: 404 })
    }
    
    // Delete from filesystem first
    const deletedFiles = []
    const failedDeletions = []
    
    for (const file of files) {
      try {
        const deleted = deleteFile(file.filename)
        if (deleted) {
          deletedFiles.push(file.filename)
          console.log(`Successfully deleted file: ${file.filename}`)
        } else {
          failedDeletions.push(file.filename)
          console.warn(`Failed to delete file from filesystem: ${file.filename}`)
        }
      } catch (error) {
        failedDeletions.push(file.filename)
        console.error(`Error deleting file ${file.filename}:`, error)
      }
    }
    
    // Only delete from database if at least some files were deleted from filesystem
    if (deletedFiles.length === 0) {
      return NextResponse.json({ 
        error: 'Failed to delete any files from filesystem', 
        failedDeletions 
      }, { status: 500 })
    }
    
    // Delete from database
    const result = await collection.deleteMany({ _id: { $in: objectIds } })
    console.log(`Deleted ${result.deletedCount} files from database`)
    
    return NextResponse.json({ 
      deletedCount: result.deletedCount,
      deletedFiles,
      failedDeletions: failedDeletions.length > 0 ? failedDeletions : undefined
    })
  } catch (error) {
    console.error('Error deleting files:', error)
    return NextResponse.json({ error: 'Failed to delete files' }, { status: 500 })
  }
}
