import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConsultationSession } from '../session/entities/session.entity';
import { Tag } from '../customer/entities/customer.entity';
import { AsrService, AsrResult } from './services/asr.service';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  constructor(
    @InjectRepository(ConsultationSession)
    private sessionRepo: Repository<ConsultationSession>,
    @InjectRepository(Tag)
    private tagRepo: Repository<Tag>,
    private asrService: AsrService,
  ) {}

  async processAudio(file: Express.Multer.File) {
    return {
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      path: `/uploads/audio/${file.filename}`,
      url: `/uploads/audio/${file.filename}`,
    };
  }

  async processAudioAndAnalyze(file: Express.Multer.File, existingTranscript?: string): Promise<{
    audio: {
      filename: string;
      originalName: string;
      size: number;
      path: string;
    };
    asr: AsrResult | null;
    transcript: string;
  }> {
    let transcript = existingTranscript;
    let asrResult: AsrResult | null = null;

    if (!transcript) {
      asrResult = await this.asrService.transcribe(file.path);
      transcript = asrResult.text;
    }

    return {
      audio: {
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        path: `/uploads/audio/${file.filename}`,
      },
      asr: asrResult,
      transcript,
    };
  }

  /** 上传音频并异步转写 */
  async uploadAndTranscribe(
    sessionId: string,
    file: Express.Multer.File,
    userId: string,
  ): Promise<{ sessionId: string; status: string; message: string }> {
    // 验证会话存在
    const session = await this.sessionRepo.findOne({ where: { id: sessionId } });
    if (!session) {
      throw new BadRequestException('会话不存在');
    }

    // 更新会话音频URL和状态
    await this.sessionRepo.update(sessionId, {
      audioUrl: `/uploads/audio/${file.filename}`,
      status: 'transcribing',
    });

    // 异步执行转写（不阻塞响应）
    this.transcribeAsync(sessionId, file.path);

    return {
      sessionId,
      status: 'transcribing',
      message: '音频上传成功，正在转写中...',
    };
  }

  /** 异步转写处理 */
  private async transcribeAsync(sessionId: string, audioPath: string): Promise<void> {
    try {
      this.logger.log(`[Upload] 开始异步转写会话 ${sessionId}`);

      // 调用 ASR 服务
      const asrResult = await this.asrService.transcribe(audioPath);

      // 更新会话转写文本
      await this.sessionRepo.update(sessionId, {
        transcript: asrResult.text,
        duration: asrResult.duration || 0,
        status: 'completed',
      });

      this.logger.log(`[Upload] 会话 ${sessionId} 转写完成`);
    } catch (error: any) {
      this.logger.error(`[Upload] 会话 ${sessionId} 转写失败: ${error.message}`);

      // 更新状态为失败
      await this.sessionRepo.update(sessionId, {
        status: 'failed',
      });
    }
  }
}
