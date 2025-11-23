/**
 * Tools Module
 * Provides tool execution infrastructure and handlers
 */

import { Module, OnModuleInit } from '@nestjs/common';

import { LLMModule } from '../llm/llm.module';

import { ToolExecutorService } from './executor/tool-executor.service';
import { BrowserActionHandler } from './handlers/browser/browser-action.handler';
import { ExtractDataHandler } from './handlers/browser/extract-data.handler';
import { NavigateToHandler } from './handlers/browser/navigate-to.handler';
import { TakeScreenshotHandler } from './handlers/browser/take-screenshot.handler';
import { BookFlightHandler } from './handlers/flight/book-flight.handler';
import { SearchFlightsHandler } from './handlers/flight/search-flights.handler';
import { AnalyzeFormHandler } from './handlers/form/analyze-form.handler';
import { FillFormHandler } from './handlers/form/fill-form.handler';
import { ApplyJobHandler } from './handlers/job/apply-job.handler';
import { GenerateCoverLetterHandler } from './handlers/job/generate-cover-letter.handler';
import { SearchJobsHandler } from './handlers/job/search-jobs.handler';
import { GenerateCaptionHandler } from './handlers/social/generate-caption.handler';
import { PostSocialHandler } from './handlers/social/post-social.handler';
import { SchedulePostHandler } from './handlers/social/schedule-post.handler';
import { CheckCompletionHandler } from './handlers/validation/check-completion.handler';
import { ValidateResultsHandler } from './handlers/validation/validate-results.handler';
import { VerifyBookingHandler } from './handlers/validation/verify-booking.handler';
import { ToolHandlerRegistry } from './registry/tool-handler-registry';
import { ToolsController } from './tools.controller';

@Module({
  imports: [LLMModule], // For LLM-based handlers
  controllers: [ToolsController],
  providers: [
    ToolHandlerRegistry,
    ToolExecutorService,
    
    // Flight handlers
    SearchFlightsHandler,
    BookFlightHandler,
    
    // Job handlers
    SearchJobsHandler,
    ApplyJobHandler,
    GenerateCoverLetterHandler,
    
    // Form handlers
    FillFormHandler,
    AnalyzeFormHandler,
    
    // Social handlers
    PostSocialHandler,
    SchedulePostHandler,
    GenerateCaptionHandler,
    
    // Browser handlers
    BrowserActionHandler,
    NavigateToHandler,
    ExtractDataHandler,
    TakeScreenshotHandler,
    
    // Validation handlers
    ValidateResultsHandler,
    CheckCompletionHandler,
    VerifyBookingHandler,
  ],
  exports: [ToolExecutorService, ToolHandlerRegistry],
})
export class ToolsModule implements OnModuleInit {
  constructor(
    private readonly registry: ToolHandlerRegistry,
    // Flight handlers
    private readonly searchFlightsHandler: SearchFlightsHandler,
    private readonly bookFlightHandler: BookFlightHandler,
    // Job handlers
    private readonly searchJobsHandler: SearchJobsHandler,
    private readonly applyJobHandler: ApplyJobHandler,
    private readonly generateCoverLetterHandler: GenerateCoverLetterHandler,
    // Form handlers
    private readonly fillFormHandler: FillFormHandler,
    private readonly analyzeFormHandler: AnalyzeFormHandler,
    // Social handlers
    private readonly postSocialHandler: PostSocialHandler,
    private readonly schedulePostHandler: SchedulePostHandler,
    private readonly generateCaptionHandler: GenerateCaptionHandler,
    // Browser handlers
    private readonly browserActionHandler: BrowserActionHandler,
    private readonly navigateToHandler: NavigateToHandler,
    private readonly extractDataHandler: ExtractDataHandler,
    private readonly takeScreenshotHandler: TakeScreenshotHandler,
    // Validation handlers
    private readonly validateResultsHandler: ValidateResultsHandler,
    private readonly checkCompletionHandler: CheckCompletionHandler,
    private readonly verifyBookingHandler: VerifyBookingHandler
  ) {}

  onModuleInit() {
    // Register all handlers
    this.registry.registerHandlers([
      // Flight handlers
      this.searchFlightsHandler,
      this.bookFlightHandler,
      // Job handlers
      this.searchJobsHandler,
      this.applyJobHandler,
      this.generateCoverLetterHandler,
      // Form handlers
      this.fillFormHandler,
      this.analyzeFormHandler,
      // Social handlers
      this.postSocialHandler,
      this.schedulePostHandler,
      this.generateCaptionHandler,
      // Browser handlers
      this.browserActionHandler,
      this.navigateToHandler,
      this.extractDataHandler,
      this.takeScreenshotHandler,
      // Validation handlers
      this.validateResultsHandler,
      this.checkCompletionHandler,
      this.verifyBookingHandler,
    ]);
  }
}
