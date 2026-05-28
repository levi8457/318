import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Body,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';

@ApiTags('文件上传')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  private getUploadDir(): string {
    const uploadDir = join(process.cwd(), 'uploads');
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }
    return uploadDir;
  }

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
  @ApiOperation({ summary: '上传音频并关联到会话，自动进行AI分析' })
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
    @UploadedFile() file: Express.Multer.File,
    @Body('transcript') transcript: string,
  ) {
    if (!file) {
      throw new BadRequestException('请上传音频文件');
    }
    return this.uploadService.processAudioAndAnalyze(file, transcript);
  }
}
