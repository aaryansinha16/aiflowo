/**
 * Generate Cover Letter Handler
 * LLM-based implementation for generating personalized cover letters
 */

import { Injectable } from '@nestjs/common';

import { LLMService } from '../../../llm/llm.service';
import { createToolError, ToolErrorCode } from '../../../types/tool-error.types';
import { ExecutionContext, ToolResult, createSuccessResult, createErrorResult } from '../../../types/tool-execution.types';
import { ToolName, GenerateCoverLetterParams } from '../../../types/tools.types';
import { BaseToolHandler } from '../base/base-tool-handler';

interface CoverLetterResult {
  coverLetter: string;
  jobTitle: string;
  company: string;
  tone: string;
  wordCount: number;
  generatedAt: string;
}

@Injectable()
export class GenerateCoverLetterHandler extends BaseToolHandler<GenerateCoverLetterParams, CoverLetterResult> {
  constructor(private readonly llmService: LLMService) {
    super(ToolName.GENERATE_COVER_LETTER);
  }

  protected async executeImpl(
    params: GenerateCoverLetterParams,
    context: ExecutionContext
  ): Promise<ToolResult<CoverLetterResult>> {
    const startTime = Date.now();

    try {
      // Build prompt for cover letter generation
      const systemPrompt = `You are a professional cover letter writer. Generate personalized, compelling cover letters that highlight relevant skills and experience. Be concise, authentic, and tailored to the specific job and company.`;

      const userPrompt = this.buildCoverLetterPrompt(params, context);

      this.logger.log(
        `Generating cover letter for ${params.jobTitle} at ${params.company} with ${params.tone} tone`
      );

      // Call LLM
      const completion = await this.llmService.complete(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        undefined,
        {
          temperature: 0.7, // Creative but consistent
          maxTokens: 1000,
        }
      );

      const coverLetterText =
        completion.choices[0]?.message?.content?.trim() ||
        'Unable to generate cover letter';

      if (!coverLetterText || coverLetterText === 'Unable to generate cover letter') {
        return createErrorResult(
          createToolError(
            ToolErrorCode.EXECUTION_ERROR,
            'LLM failed to generate cover letter',
            { params },
            true
          ),
          this.name,
          Date.now() - startTime,
          context.stepId
        );
      }

      const result: CoverLetterResult = {
        coverLetter: coverLetterText,
        jobTitle: params.jobTitle,
        company: params.company,
        tone: params.tone,
        wordCount: coverLetterText.split(/\s+/).length,
        generatedAt: new Date().toISOString(),
      };

      this.logger.log(
        `Generated cover letter: ${result.wordCount} words for ${params.company}`
      );

      return createSuccessResult(
        result,
        this.name,
        Date.now() - startTime,
        context.stepId
      );
    } catch (error) {
      this.logger.error('Failed to generate cover letter:', error);
      return createErrorResult(
        createToolError(
          ToolErrorCode.EXTERNAL_API_ERROR,
          `Cover letter generation failed: ${error.message}`,
          { error: error.message },
          true
        ),
        this.name,
        Date.now() - startTime,
        context.stepId
      );
    }
  }

  private buildCoverLetterPrompt(
    params: GenerateCoverLetterParams,
    context: ExecutionContext
  ): string {
    let prompt = `Generate a ${params.tone} cover letter for the following job application:\n\n`;
    prompt += `Job Title: ${params.jobTitle}\n`;
    prompt += `Company: ${params.company}\n`;

    if (params.jobDescription) {
      prompt += `\nJob Description:\n${params.jobDescription}\n`;
    }

    if (params.resumeId) {
      prompt += `\nNote: Applicant has provided resume (${params.resumeId}). Tailor the cover letter to highlight relevant skills and experience.\n`;
    }

    if (context.userProfile?.resumeUrl) {
      prompt += `\nApplicant Resume URL: ${context.userProfile.resumeUrl}\n`;
    }

    prompt += `\nRequirements:
- Keep it professional and concise (250-350 words)
- Express genuine interest in the role and company
- Highlight relevant skills and experience
- Use a ${params.tone} tone throughout
- Include a strong opening and closing
- Do not include placeholder text like [Your Name] or [Date]
- Write in first person

Generate only the cover letter text, without any additional formatting or explanations.`;

    return prompt;
  }
}
