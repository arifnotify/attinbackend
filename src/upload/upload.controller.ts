import {
  Controller,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';

import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';

import { CloudinaryStorage } from 'multer-storage-cloudinary';

import cloudinary from './cloudinary.config';

import { UploadService } from './upload.service';

@Controller('upload')
export class UploadController {
  constructor(private uploadService: UploadService) {}

  // SINGLE IMAGE UPLOAD
  @Post('single')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: new CloudinaryStorage({
        cloudinary,

        params: {
          folder: 'ecommerce/products',

          allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        } as any,
      }),
    }),
  )
  uploadSingle(
    @UploadedFile()
    file: any,
  ) {
    return this.uploadService.getFileResponse(file);
  }

  // MULTIPLE IMAGE UPLOAD
  @Post('multiple')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: new CloudinaryStorage({
        cloudinary,

        params: {
          folder: 'ecommerce/products',

          allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        } as any,
      }),
    }),
  )
  uploadMultiple(
    @UploadedFiles()
    files: any[],
  ) {
    return files.map((file) => this.uploadService.getFileResponse(file));
  }
}
