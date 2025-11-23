/**
 * Generate Caption Handler
 * LLM-based implementation for generating social media captions with hashtags
 */

import { Injectable } from '@nestjs/common';

import { LLMService } from '../../../llm/llm.service';
import { ToolName, GenerateCaptionParams } from '../../../types/tools.types';
import { ExecutionContext, ToolResult, createSuccessResult, createErrorResult } from '../../../types/tool-execution.types';
import { createToolError, ToolErrorCode } from '../../../types/tool-error.types';
import { BaseToolHandler } from '../base/base-tool-handler';

interface CaptionResult {
  caption: string;
  hashtags: string[];
  platform: string;
  tone: string;
  characterCount: number;
  generatedAt: string;
}

@Injectable()
export class GenerateCaptionHandler extends BaseToolHandler<GenerateCaptionParams, CaptionResult> {
  constructor(private readonly llmService: LLMService) {
    super(ToolName.GENERATE_CAPTION);
  }

  protected async executeImpl(
    params: GenerateCaptionParams,
    context: ExecutionContext
  ): Promise<ToolResult<CaptionResult>> {
    const startTime = Date.now();

    try {
      // Build prompt for caption generation
      const systemPrompt = `You are a social media content creator specializing in ${params.platform}. Generate engaging, platform-appropriate captions with relevant hashtags.`;

      const userPrompt = this.buildCaptionPrompt(params);

      this.logger.log(
        `Generating ${params.tone} caption for ${params.platform}: ${params.context}`
      );

      // Call LLM
      const completion = await this.llmService.complete(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        undefined,
        {
          temperature: 0.8, // More creative for social media
          maxTokens: 500,
        }
      );

      const generatedText =
        completion.choices[0]?.message?.content?.trim() ||
        'Unable to generate caption';

      if (!generatedText || generatedText === 'Unable to generate caption') {
        return createErrorResult(
          createToolError(
            ToolErrorCode.EXECUTION_ERROR,
            'LLM failed to generate caption',
            { params },
            true
          ),
          this.name,
          Date.now() - startTime,
          context.stepId
        );
      }

      // Parse caption and hashtags
      const { caption, hashtags } = this.parseCaptionAndHashtags(generatedText, params.includeHashtags);

      const result: CaptionResult = {
        caption,
        hashtags,
        platform: params.platform,
        tone: params.tone,
        characterCount: caption.length,
        generatedAt: new Date().toISOString(),
      };

      this.logger.log(
        `Generated caption: ${result.characterCount} characters, ${result.hashtags.length} hashtags`
      );

      return createSuccessResult(
        result,
        this.name,
        Date.now() - startTime,
        context.stepId
      );
    } catch (error) {
      this.logger.error('Failed to generate caption:', error);
      return createErrorResult(
        createToolError(
          ToolErrorCode.EXTERNAL_API_ERROR,
          `Caption generation failed: ${error.message}`,
          { error: error.message },
          true
        ),
        this.name,
        Date.now() - startTime,
        context.stepId
      );
    }
  }

  private buildCaptionPrompt(params: GenerateCaptionParams): string {
    let prompt = `Generate a ${params.tone} caption for ${params.platform} about: ${params.context}\n\n`;

    prompt += `Requirements:\n`;
    
    // Platform-specific requirements
    switch (params.platform) {
      case 'instagram':
        prompt += `- Instagram-style: engaging, visual-focused\n`;
        prompt += `- Use line breaks for readability\n`;
        prompt += `- Max 2200 characters\n`;
        break;
      case 'twitter':
        prompt += `- Twitter/X-style: concise, punchy\n`;
        prompt += `- Max 280 characters (including hashtags)\n`;
        break;
      case 'facebook':
        prompt += `- Facebook-style: conversational, community-focused\n`;
        prompt += `- Can be longer and more detailed\n`;
        break;
      case 'linkedin':
        prompt += `- LinkedIn-style: professional, informative\n`;
        prompt += `- Focus on insights and value\n`;
        break;
    }

    prompt += `- Use a ${params.tone} tone\n`;
    
    if (params.includeHashtags) {
      prompt += `- Include 5-10 relevant hashtags at the end\n`;
      prompt += `- Mix popular and niche hashtags\n`;
    }

    if (params.maxLength) {
      prompt += `- Keep total length under ${params.maxLength} characters\n`;
    }

    prompt += `\nFormat: Write the caption text first, then add hashtags on a new line if requested.`;

    return prompt;
  }

  private parseCaptionAndHashtags(text: string, includeHashtags: boolean): {
    caption: string;
    hashtags: string[];
  } {
    if (!includeHashtags) {
      return { caption: text.trim(), hashtags: [] };
    }

    // Split caption and hashtags
    const lines = text.split('\n');
    const captionLines: string[] = [];
    const hashtagLines: string[] = [];

    let inHashtagSection = false;

    for (const line of lines) {
      if (line.trim().startsWith('#') || inHashtagSection) {
        inHashtagSection = true;
        hashtagLines.push(line);
      } else {
        captionLines.push(line);
      }
    }

    const caption = captionLines.join('\n').trim();
    const hashtagText = hashtagLines.join(' ').trim();
    
    // Extract hashtags
    const hashtags = hashtagText.match(/#\w+/g) || [];

    return {
      caption,
      hashtags: hashtags.map((h) => h.toLowerCase()),
    };
  }
}
