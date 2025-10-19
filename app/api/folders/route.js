import { NextResponse } from 'next/server'
import clientPromise from '../../../lib/mongodb'
import { deleteFile } from '../../../lib/fileStorage'
import { ObjectId } from 'mongodb'

// GET /api/folders - Fetch all folders
export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db('filemanager')
    const collection = db.collection('folders')
    
    const folders = await collection.find({}).sort({ createdAt: -1 }).toArray()
    
    return NextResponse.json({ folders })
  } catch (error) {
    console.error('Error fetching folders:', error)
    return NextResponse.json({ error: 'Failed to fetch folders' }, { status: 500 })
  }
}

// POST /api/folders - Create new folder
export async function POST(request) {
  try {
    const { name } = await request.json()
    
    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Folder name is required' }, { status: 400 })
    }
    
    const client = await clientPromise
    const db = client.db('filemanager')
    const collection = db.collection('folders')
    
    const folderDoc = {
      name: name.trim(),
      createdAt: new Date()
    }
    
    const result = await collection.insertOne(folderDoc)
    
    return NextResponse.json({ 
      folder: { ...folderDoc, _id: result.insertedId } 
    })
  } catch (error) {
    console.error('Error creating folder:', error)
    return NextResponse.json({ error: 'Failed to create folder' }, { status: 500 })
  }
}

// DELETE /api/folders - Delete folder and its files
export async function DELETE(request) {
  try {
    const { folderId } = await request.json()
    
    if (!folderId) {
      return NextResponse.json({ error: 'Folder ID is required' }, { status: 400 })
    }
    
    // Convert string folderId to ObjectId
    let objectId
    try {
      objectId = new ObjectId(folderId)
    } catch (error) {
      return NextResponse.json({ error: `Invalid folder ID: ${folderId}` }, { status: 400 })
    }
    
    const client = await clientPromise
    const db = client.db('filemanager')
    const filesCollection = db.collection('files')
    const foldersCollection = db.collection('folders')
    
    // Check if folder exists
    const folder = await foldersCollection.findOne({ _id: objectId })
    if (!folder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 })
    }
    
    // Get all files in the folder
    const files = await filesCollection.find({ folderId: objectId }).toArray()
    console.log(`Found ${files.length} files in folder "${folder.name}" to delete`)
    
    // Delete files from filesystem first
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
    
    // Delete files from database
    const filesDeleteResult = await filesCollection.deleteMany({ folderId: objectId })
    console.log(`Deleted ${filesDeleteResult.deletedCount} files from database`)
    
    // Delete folder from database
    const folderDeleteResult = await foldersCollection.deleteOne({ _id: objectId })
    console.log(`Deleted folder: ${folder.name}`)
    
    if (folderDeleteResult.deletedCount === 0) {
      return NextResponse.json({ error: 'Failed to delete folder from database' }, { status: 500 })
    }
    
    return NextResponse.json({ 
      deletedCount: folderDeleteResult.deletedCount,
      filesDeleted: filesDeleteResult.deletedCount,
      deletedFiles,
      failedDeletions: failedDeletions.length > 0 ? failedDeletions : undefined,
      folderName: folder.name
    })
  } catch (error) {
    console.error('Error deleting folder:', error)
    return NextResponse.json({ error: 'Failed to delete folder' }, { status: 500 })
  }
}
