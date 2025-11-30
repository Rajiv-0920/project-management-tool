import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'my_cloud',
  api_key: process.env.CLOUDINARY_API_KEY || 'my_key',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'my_secret',
})

export default cloudinary
