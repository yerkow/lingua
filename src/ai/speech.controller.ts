import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors
} from '@nestjs/common';
import { OpenaiService } from './openai.service';
import express from 'express';
import {Readable} from "node:stream";
import {FileInterceptor} from "@nestjs/platform-express";

@Controller('speech')
export class SpeechController {
  constructor(private openaiService: OpenaiService) {
  }

  /**
   * Эндпоинт для преобразования текста в речь с выгрузкой файла
   */
  @Post('tts/generate')
  async generateSpeech(
    @Body() body: { text: string; voice?: string },
    @Res({passthrough: true}) res: express.Response,
  ): Promise<StreamableFile> {
    const audioBuffer = await this.openaiService.generateSpeech(
      body.text,
      body.voice || 'alloy'
    );

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Disposition': 'attachment; filename="speech.mp3"',
    });

    return new StreamableFile(audioBuffer);
  }

  /**
   * Эндпоинт для стриминга аудио в реальном времени
   */
  @Post('tts/stream')
  async streamAudio(
    @Body() body: { text: string; voice?: string },
    @Res() res: express.Response,
  ) {
    const audioBuffer = await this.openaiService.generateSpeech(
      body.text,
      body.voice || 'alloy'
    );

    const stream = Readable.from(audioBuffer);

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length.toString(),
    });

    stream.pipe(res);
  }

  /**
   * Основной эндпоинт для распознавания речи
   */
  @Post('stt/transcribe')
  @UseInterceptors(FileInterceptor('audio'))
  async transcribeAudio(
    @UploadedFile() file: Express.Multer.File,
    @Body('language') language?: string,
    @Body('correct') correct?: string,
  ) {
    if (!file) {
      throw new BadRequestException('Аудиофайл не загружен');
    }

    const allowedMimeTypes = [
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/webm',
      'audio/ogg',
      'audio/m4a',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Неподдерживаемый формат файла');
    }

    const maxSize = 25 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('Файл слишком большой. Максимум 25MB');
    }
    const rawText = await this.openaiService.transcribeAudio(file, language);
    let finalText = rawText;
    let correction: {
      correctedText: string;
      errors: string[];
      confidence: string;
    } | null = null;

    if (correct === 'true' && language) {
      correction = await this.openaiService.correctTranscription(
        rawText,
        language,
      );
      finalText = correction.correctedText;
    }

    return {
      success: true,
      text: finalText,
      rawText: correct === 'true' ? rawText : undefined,
      correction: correction
        ? {
          errors: correction.errors,
          confidence: correction.confidence,
        }
        : undefined,
      metadata: {
        filename: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        language: language || 'auto',
        corrected: correct === 'true',
      },
    };
  }

  /**
   * Эндпоинт с детальной информацией и временными метками
   */
  @Post('stt/transcribe-detailed')
  @UseInterceptors(FileInterceptor('audio'))
  async transcribeAudioDetailed(
    @UploadedFile() file: Express.Multer.File,
    @Body('language') language?: string,
  ) {
    if (!file) {
      throw new BadRequestException('Аудиофайл не загружен');
    }

    const result = await this.openaiService.transcribeAudioDetailed(
      file,
      language,
    );

    return {
      success: true,
      transcription: result,
      metadata: {
        filename: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
      },
    };
  }
}
