/**
 * Search Jobs Handler
 * Mock implementation for job search
 */

import { Injectable } from '@nestjs/common';

import { ExecutionContext, ToolResult, createSuccessResult } from '../../../types/tool-execution.types';
import { ToolName, SearchJobsParams } from '../../../types/tools.types';
import { BaseToolHandler } from '../base/base-tool-handler';

interface JobPosting {
  id: string;
  title: string;
  company: string;
  location: string;
  remote: boolean;
  experienceLevel: string;
  salary: string;
  description: string;
  postedDate: string;
  url: string;
}

@Injectable()
export class SearchJobsHandler extends BaseToolHandler<SearchJobsParams, { jobs: JobPosting[] }> {
  constructor() {
    super(ToolName.SEARCH_JOBS);
  }

  protected async executeImpl(
    params: SearchJobsParams,
    context: ExecutionContext
  ): Promise<ToolResult<{ jobs: JobPosting[] }>> {
    const startTime = Date.now();

    // Mock job search results
    const jobs: JobPosting[] = [
      {
        id: `job_${Date.now()}_1`,
        title: params.query,
        company: 'Google',
        location: params.location || 'Remote',
        remote: params.remote ?? true,
        experienceLevel: params.experienceLevel || 'mid',
        salary: '$120k - $180k',
        description: `Looking for a talented ${params.query} to join our team...`,
        postedDate: new Date().toISOString(),
        url: 'https://careers.google.com/jobs/123',
      },
      {
        id: `job_${Date.now()}_2`,
        title: params.query,
        company: 'Microsoft',
        location: params.location || 'Remote',
        remote: params.remote ?? true,
        experienceLevel: params.experienceLevel || 'mid',
        salary: '$110k - $170k',
        description: `Join our amazing team as a ${params.query}...`,
        postedDate: new Date().toISOString(),
        url: 'https://careers.microsoft.com/jobs/456',
      },
    ];

    this.logger.log(`Found ${jobs.length} jobs matching query: ${params.query}`);

    return createSuccessResult(
      { jobs },
      this.name,
      Date.now() - startTime,
      context.stepId
    );
  }
}
