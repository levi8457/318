import { Controller, Get, Post, Put, Param, Body, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { SessionService } from './session.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

class CreateSessionDto {
  @ApiProperty({ example: 'customer-uuid' })
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  transcript?: string;
}

class UpdateTranscriptDto {
  @ApiProperty({ description: '语音转写文本' })
  @IsString()
  @IsNotEmpty()
  transcript: string;
}

@ApiTags('会话管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sessions')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Get()
  @ApiOperation({ summary: '会话列表（admin 看全部，consultant 看自己的）' })
  findAll(@CurrentUser('role') role: string, @CurrentUser('userId') userId: string) {
    return this.sessionService.findAll(role, userId);
  }

  @Post()
  @ApiOperation({ summary: '创建面诊会话（含 Mock AI 分析）' })
  create(@Body() dto: CreateSessionDto, @CurrentUser('userId') userId: string) {
    return this.sessionService.create(dto.customerId, userId, dto.transcript);
  }

  @Post(':id/audio')
  @ApiOperation({ summary: '上传音频文件到会话，自动进行语音转写和AI分析' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('audio', {
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
          cb(new Error('只支持 MP3、WAV、M4A、OGG、WEBM、AAC 格式'), false);
        }
      },
    }),
  )
  async uploadAudio(
    @Param('id') sessionId: string,
    @UploadedFile() audio: Express.Multer.File,
  ) {
    const audioUrl = `/uploads/audio/${audio.filename}`;
    return {
      sessionId,
      audioUrl,
      originalName: audio.originalname,
      size: audio.size,
      message: '音频上传成功，正在进行AI分析...',
    };
  }

  @Put(':id/transcript')
  @ApiOperation({ summary: '更新会话转写文本并重新分析' })
  updateTranscript(
    @Param('id') sessionId: string,
    @Body() dto: UpdateTranscriptDto,
  ) {
    return this.sessionService.reanalyze(sessionId, dto.transcript);
  }

  @Get(':id')
  @ApiOperation({ summary: '会话详情（含转写/摘要/策略）' })
  findOne(@Param('id') id: string, @CurrentUser('role') role: string, @CurrentUser('userId') userId: string) {
    return this.sessionService.findOne(id, role, userId);
  }

  @Post(':id/analyze')
  @ApiOperation({ summary: '触发 AI 分析' })
  analyze(@Param('id') id: string) {
    return this.sessionService.analyze(id);
  }

  @Get(':id/strategy')
  @ApiOperation({ summary: '获取跟进策略' })
  async getStrategy(@Param('id') id: string) {
    const session = await this.sessionService.findOne(id, 'admin', '');
    return session.followUpStrategy;
  }
}
