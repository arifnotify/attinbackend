import { Injectable } from '@nestjs/common';

@Injectable()
export class UploadService {
  getFileResponse(file: any) {
    return {
      success: true,

      url: file.path,

      public_id: file.filename,
    };
  }
}
