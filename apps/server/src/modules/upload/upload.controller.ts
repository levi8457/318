import {
  Controller,
  Post,
  Param,
  UseInterceptors,
  UploadedFile,
  Body,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('文件上传')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('audio')
  @ApiOperation({ summary: '上传音频文件（MP3/WAV）' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadDir = join(process.cwd(), 'uploads', 'audio');
          if (!existsSync(uploadDir)) {
            mkdirSync(uploadDir, { recursive: true });
          }
          cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      limits: {
        fileSize: 50 * 1024 * 1024,
      },
      fileFilter: (req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase();
        const allowedExts = ['.mp3', '.wav', '.m4a', '.ogg', '.webm', '.aac'];
        if (allowedExts.includes(ext)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('只支持 MP3、WAV、M4A、OGG、WEBM、AAC 格式'), false);
        }
      },
    }),
  )
  async uploadAudio(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('请上传音频文件');
    }
    return this.uploadService.processAudio(file);
  }

  @Post('audio/session/:sessionId')
  @ApiOperation({ summary: '上传音频并关联到会话，异步转写' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadDir = join(process.cwd(), 'uploads', 'audio');
          if (!existsSync(uploadDir)) {
            mkdirSync(uploadDir, { recursive: true });
          }
          cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      limits: {
        fileSize: 50 * 1024 * 1024,
      },
      fileFilter: (req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase();
        const allowedExts = ['.mp3', '.wav', '.m4a', '.ogg', '.webm', '.aac'];
        if (allowedExts.includes(ext)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('只支持 MP3、WAV、M4A、OGG、WEBM、AAC 格式'), false);
        }
      },
    }),
  )
  async uploadAudioForSession(
    @Param('sessionId') sessionId: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('userId') userId: string,
  ) {
    if (!file) {
      throw new BadRequestException('请上传音频文件');
    }
    return this.uploadService.uploadAndTranscribe(sessionId, file, userId);
  }
}
