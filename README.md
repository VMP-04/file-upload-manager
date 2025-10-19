# Next.js File Manager

A modern, production-ready file management application built with Next.js 14, MongoDB, and Tailwind CSS.

## Features

- 📁 **File Upload**: Single and multiple file upload with drag & drop support
- 🗂️ **Folder Management**: Create, organize, and delete folders
- 🗑️ **File Operations**: Delete single or multiple files
- 📥 **Download Files**: Download files directly from the interface
- 🎨 **Modern UI**: Beautiful glassmorphism design with gradient backgrounds
- 📱 **Responsive**: Works on mobile, tablet, and desktop
- ⚡ **Real-time**: Instant updates after operations

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: MongoDB
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Language**: JavaScript

## Prerequisites

- Node.js 18+ 
- MongoDB running locally or MongoDB Atlas connection
- npm or yarn package manager

## Installation

1. **Clone or download the project**
   ```bash
   cd nextjs-file-manager
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   MONGODB_URI=MONGODB_ATLAS_CONNECTION_STRING
   UPLOAD_DIR=./public/uploads
   NEXT_PUBLIC_MAX_FILE_SIZE=10485760
   ```

4. **Start MongoDB**
   Make sure MongoDB is running on your system or update the `MONGODB_URI` in `.env.local` to point to your MongoDB instance.

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
nextjs-file-manager/
├── app/
│   ├── api/
│   │   ├── files/
│   │   │   └── route.js          # File API endpoints
│   │   └── folders/
│   │       └── route.js          # Folder API endpoints
│   ├── page.js                   # Main file manager component
│   ├── layout.js                 # Root layout
│   └── globals.css               # Global styles
├── lib/
│   ├── mongodb.js                # MongoDB connection
│   └── fileStorage.js           # File storage utilities
├── public/
│   └── uploads/                  # File storage directory
├── .env.local                   # Environment variables
├── .gitignore                   # Git ignore rules
├── next.config.js               # Next.js configuration
├── tailwind.config.js           # Tailwind CSS configuration
├── postcss.config.js            # PostCSS configuration
└── package.json                 # Dependencies and scripts
```

## API Endpoints

### Files API (`/api/files`)

- **GET**: Fetch files (optionally filtered by folder)
  - Query params: `folderId` (optional)
- **POST**: Upload files
  - Body: `FormData` with files and optional `folderId`
- **DELETE**: Delete files
  - Body: `{ fileIds: string[] }`

### Folders API (`/api/folders`)

- **GET**: Fetch all folders
- **POST**: Create new folder
  - Body: `{ name: string }`
- **DELETE**: Delete folder and its files
  - Body: `{ folderId: string }`

## Usage

1. **Upload Files**: Click the "Upload Files" button to select and upload files
2. **Create Folders**: Click the folder plus icon in the sidebar to create new folders
3. **Organize Files**: Click on a folder to view files inside it
4. **Select Files**: Use checkboxes to select single or multiple files
5. **Delete Files**: Select files and click the delete button
6. **Download Files**: Click the download icon next to any file

## File Storage

- Files are stored in the `public/uploads/` directory
- Each file gets a unique timestamp-based filename
- Original filenames are preserved in the database
- File metadata is stored in MongoDB

## Database Schema

### Files Collection
```javascript
{
  _id: ObjectId,
  name: string,           // Original filename
  filename: string,       // Stored filename (with timestamp)
  size: number,          // File size in bytes
  type: string,          // MIME type
  folderId: string | null, // Reference to folder or null
  uploadedAt: Date,
  path: string           // Public path: /uploads/filename
}
```

### Folders Collection
```javascript
{
  _id: ObjectId,
  name: string,
  createdAt: Date
}
```

## Customization

### Styling
The application uses Tailwind CSS with custom glassmorphism effects. You can modify the styling in:
- `app/globals.css` - Global styles and custom CSS
- `app/page.js` - Component-specific styling
- `tailwind.config.js` - Tailwind configuration

### File Size Limits
Update the `NEXT_PUBLIC_MAX_FILE_SIZE` environment variable to change the maximum file size limit.

### Database
The application uses MongoDB with the database name `filemanager`. You can change this by updating the connection string in `.env.local`.

## Production Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start the production server**
   ```bash
   npm start
   ```

3. **Environment Setup**
   - Ensure MongoDB is accessible from your production environment
   - Update environment variables for production
   - Consider using a cloud storage service for file uploads in production

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check the `MONGODB_URI` in `.env.local`
   - Verify network connectivity

2. **File Upload Issues**
   - Check file size limits
   - Ensure the uploads directory has write permissions
   - Verify the `UPLOAD_DIR` environment variable

3. **Build Errors**
   - Clear `.next` directory and rebuild
   - Check for TypeScript errors (if using TypeScript)
   - Verify all dependencies are installed

## License

This project is open source and available under the MIT License.
