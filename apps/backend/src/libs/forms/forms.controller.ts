import { Controller, Get, Post, Body, Param, Res, Logger, UseGuards } from '@nestjs/common';
import { Response } from 'express';

import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Public } from '../../auth/decorators/public.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { QueueName } from '../queue/queue.constants';
import { QueueService } from '../queue/queue.service';

import { FieldMapperService } from './field-mapper.service';
import { FormProfileService } from './form-profile.service';
import { SessionService, BrowserSession } from './session.service';

/**
 * DTO for form fill request
 */
export interface FillFormDto {
  url: string;
  profileId?: string; // Optional: Use specific profile
  userData?: Record<string, any>; // Optional: Manual data (fallback)
  files?: Record<string, string>;
}

@Controller('forms')
export class FormsController {
  private readonly logger = new Logger(FormsController.name);

  constructor(
    private readonly sessionService: SessionService,
    private readonly queueService: QueueService,
    private readonly fieldMapperService: FieldMapperService,
    private readonly formProfileService: FormProfileService,
  ) {}

  /**
   * Fill form automatically with AI mapping
   * Requires authentication to fetch user's form profile
   */
  @UseGuards(JwtAuthGuard)
  @Post('fill')
  async fillForm(@CurrentUser() user: { id: string }, @Body() dto: FillFormDto) {
    this.logger.log('Received form fill request', {
      url: dto.url,
      userId: user.id,
      profileId: dto.profileId,
      hasManualData: !!dto.userData,
    });

    try {
      // Fetch user data from profile or use manual data
      let userData: Record<string, any>;

      if (dto.profileId) {
        // Use specific profile
        const profile = await this.formProfileService.getProfile(user.id, dto.profileId);
        userData = this.formProfileService.profileToFormData(profile);
        this.logger.log(`Using profile "${profile.name}" for form fill`);
      } else if (dto.userData) {
        // Use manual data (backward compatibility)
        userData = dto.userData;
        this.logger.log('Using manual data for form fill');
      } else {
        // Use default profile
        const defaultProfile = await this.formProfileService.getDefaultProfile(user.id);
        if (!defaultProfile) {
          return {
            success: false,
            error: 'No form profile found. Please create a profile first or provide userData.',
          };
        }
        userData = this.formProfileService.profileToFormData(defaultProfile);
        this.logger.log(`Using default profile "${defaultProfile.name}" for form fill`);
      }

      // Add files if provided
      if (dto.files) {
        Object.assign(userData, dto.files);
      }

      // Phase 1: Analyze form structure
      this.logger.log('Phase 1: Analyzing form structure');
      const analysisJob = await this.queueService.addJob(
        QueueName.BROWSER,
        'fill_form_auto',
        {
          url: dto.url,
          // Phase 1: Just analyze
        }
      );

      // Wait for form analysis to complete
      const analysisResult = await this.waitForJob(analysisJob.id as string, QueueName.BROWSER);
      
      if (!analysisResult.success || !analysisResult.data?.formStructure) {
        throw new Error('Form analysis failed');
      }

      const formFields = analysisResult.data.formStructure.fields;
      this.logger.log(`Found ${formFields.length} form fields`);

      // Phase 2: Use AI to map user data to fields
      this.logger.log('Phase 2: Mapping user data to fields with AI');
      const fieldMappings = await this.fieldMapperService.mapUserDataToFields(
        formFields,
        userData,
        dto.files
      );

      this.logger.log(`Generated ${fieldMappings.length} field mappings`);

      // Phase 3: Fill the form with mapped data
      this.logger.log('Phase 3: Filling form with mapped data');
      const fillJob = await this.queueService.addJob(
        QueueName.BROWSER,
        'fill_form_auto',
        {
          url: dto.url,
          formStructure: analysisResult.data.formStructure,
          fieldMappings: fieldMappings,
        }
      );

      // Wait for form fill to complete
      const fillResult = await this.waitForJob(fillJob.id as string, QueueName.BROWSER);

      if (!fillResult.success) {
        throw new Error('Form filling failed');
      }

      // Store session for user review
      let sessionUrl = null;
      if (fillResult.data?.session) {
        const sessionId = await this.sessionService.storeSession(fillResult.data.session);
        sessionUrl = `${process.env.BACKEND_URL || 'http://localhost:4000'}/api/forms/session/${sessionId}/load`;
      }

      this.logger.log('Form fill completed successfully');

      return {
        success: true,
        data: {
          fieldsFilled: fillResult.data?.fieldsFilled || 0,
          fieldsFailed: fillResult.data?.fieldsFailed || 0,
          screenshot: fillResult.data?.screenshot,
          sessionUrl,
          mappings: fieldMappings,
        },
      };
    } catch (error) {
      this.logger.error('Form fill request failed', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Wait for a job to complete (with timeout)
   */
  private async waitForJob(
    jobId: string,
    queueName: QueueName,
    timeoutMs = 60000
  ): Promise<any> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      const job = await this.queueService.getJob(queueName, jobId);
      
      if (!job) {
        throw new Error(`Job ${jobId} not found`);
      }

      if (await job.isCompleted()) {
        return await job.returnvalue;
      }

      if (await job.isFailed()) {
        const error = await job.failedReason;
        throw new Error(`Job failed: ${error}`);
      }

      // Wait 500ms before checking again
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    throw new Error(`Job ${jobId} timed out after ${timeoutMs}ms`);
  }

  @Public()
  @Post('session/store')
  async storeSession(@Body() sessionData: BrowserSession) {
    const sessionId = await this.sessionService.storeSession(sessionData);
    return {
      success: true,
      sessionId,
    };
  }

  /**
   * Get session data (API endpoint)
   * Public endpoint - no authentication required
   */
  @Public()
  @Get('session/:sessionId/data')
  async getSessionData(@Param('sessionId') sessionId: string) {
    const session = await this.sessionService.getSession(sessionId);
    return {
      success: true,
      data: session,
    };
  }

  /**
   * Session loader page
   * This HTML page loads the session and redirects to the form URL
   * Public endpoint - no authentication required
   */
  @Public()
  @Get('session/:sessionId/load')
  async loadSession(
    @Param('sessionId') sessionId: string,
    @Res() res: Response
  ) {
    try {
      const session = await this.sessionService.getSession(sessionId);

      // Return HTML page that loads the session
      const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Loading Filled Form...</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .loader {
            text-align: center;
            padding: 2rem;
        }
        .spinner {
            border: 4px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top: 4px solid white;
            width: 50px;
            height: 50px;
            animation: spin 1s linear infinite;
            margin: 0 auto 1.5rem;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        h1 {
            font-size: 1.5rem;
            font-weight: 600;
            margin: 0 0 0.5rem;
        }
        p {
            font-size: 1rem;
            opacity: 0.9;
            margin: 0;
        }
        .success {
            color: #4ade80;
            font-weight: 600;
            margin-top: 1rem;
        }
        .error {
            color: #f87171;
            font-weight: 600;
            margin-top: 1rem;
        }
    </style>
</head>
<body>
    <div class="loader">
        <div class="spinner"></div>
        <h1>Loading Your Filled Form</h1>
        <p id="status">Restoring session...</p>
    </div>

    <script>
        const sessionData = ${JSON.stringify(session)};
        
        async function loadSession() {
            try {
                const status = document.getElementById('status');
                
                // Step 1: Set localStorage
                if (sessionData.localStorage) {
                    status.textContent = 'Restoring local storage...';
                    for (const [key, value] of Object.entries(sessionData.localStorage)) {
                        localStorage.setItem(key, value);
                    }
                }
                
                // Step 2: Set sessionStorage
                if (sessionData.sessionStorage) {
                    status.textContent = 'Restoring session storage...';
                    for (const [key, value] of Object.entries(sessionData.sessionStorage)) {
                        sessionStorage.setItem(key, value);
                    }
                }
                
                // Step 3: Set cookies (limited - some cookies can't be set via JS)
                if (sessionData.cookies) {
                    status.textContent = 'Restoring cookies...';
                    for (const cookie of sessionData.cookies) {
                        if (!cookie.httpOnly) { // HttpOnly cookies can't be set via JS
                            let cookieString = \`\${cookie.name}=\${cookie.value}\`;
                            if (cookie.domain) cookieString += \`; domain=\${cookie.domain}\`;
                            if (cookie.path) cookieString += \`; path=\${cookie.path}\`;
                            if (cookie.expires) {
                                const date = new Date(cookie.expires * 1000);
                                cookieString += \`; expires=\${date.toUTCString()}\`;
                            }
                            if (cookie.secure) cookieString += '; secure';
                            if (cookie.sameSite) cookieString += \`; samesite=\${cookie.sameSite}\`;
                            
                            document.cookie = cookieString;
                        }
                    }
                }
                
                // Step 4: Redirect to form filler page or direct to form
                if (sessionData.fieldMappings && sessionData.fieldMappings.length > 0) {
                    // Has field mappings - go to filler page
                    status.textContent = 'Preparing filled form...';
                    sessionStorage.setItem('__formFillSession', JSON.stringify(sessionData));
                    setTimeout(() => {
                        window.location.href = '/api/forms/session/${sessionId}/filler';
                    }, 1000);
                } else {
                    // No mappings - just redirect to form
                    status.textContent = 'Session restored! Redirecting...';
                    status.className = 'success';
                    setTimeout(() => {
                        window.location.href = sessionData.url;
                    }, 1000);
                }
                
            } catch (error) {
                console.error('Failed to load session:', error);
                const status = document.getElementById('status');
                status.textContent = 'Failed to restore session: ' + error.message;
                status.className = 'error';
            }
        }
        
        // Start loading
        loadSession();
    </script>
</body>
</html>
      `;

      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      this.logger.error('Failed to load session page', error);
      
      const errorHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Session Error</title>
    <style>
        body {
            font-family: system-ui, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            background: #fee;
            color: #c00;
        }
        .error {
            text-align: center;
            padding: 2rem;
        }
    </style>
</head>
<body>
    <div class="error">
        <h1>❌ Session Error</h1>
        <p>${error.message || 'Session not found or expired'}</p>
        <p><small>Please request a new form fill.</small></p>
    </div>
</body>
</html>
      `;
      
      res.status(404).setHeader('Content-Type', 'text/html').send(errorHtml);
    }
  }

  /**
   * Form filler page - provides bookmarklet for cross-origin filling
   * Public endpoint - no authentication required
   */
  @Public()
  @Get('session/:sessionId/filler')
  async formFiller(
    @Param('sessionId') sessionId: string,
    @Res() res: Response
  ) {
    try {
      const session = await this.sessionService.getSession(sessionId);
      
      // Generate bookmarklet code
      const fillerCode = this.generateFillerCode(session.fieldMappings || []);
      const bookmarkletCode = `javascript:(${fillerCode})();`;
      
      const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Fill Your Form</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
        }
        .container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            max-width: 600px;
            width: 100%;
            padding: 2.5rem;
        }
        h1 {
            color: #667eea;
            margin-bottom: 1rem;
            font-size: 2rem;
        }
        .info {
            background: #f8f9fa;
            border-left: 4px solid #667eea;
            padding: 1rem;
            margin: 1.5rem 0;
            border-radius: 4px;
        }
        .url {
            font-family: 'Courier New', monospace;
            background: #f8f9fa;
            padding: 0.75rem;
            border-radius: 4px;
            word-break: break-all;
            font-size: 0.9rem;
            margin: 1rem 0;
        }
        .btn {
            display: block;
            width: 100%;
            padding: 1rem;
            border: none;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
            text-align: center;
            text-decoration: none;
            margin: 1rem 0;
        }
        .btn-primary {
            background: #667eea;
            color: white;
        }
        .btn-primary:hover {
            background: #5568d3;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }
        .btn-secondary {
            background: #e9ecef;
            color: #495057;
        }
        .btn-secondary:hover {
            background: #dee2e6;
        }
        .steps {
            counter-reset: step;
            margin: 1.5rem 0;
        }
        .step {
            counter-increment: step;
            position: relative;
            padding-left: 3rem;
            margin: 1.5rem 0;
        }
        .step:before {
            content: counter(step);
            position: absolute;
            left: 0;
            top: 0;
            background: #667eea;
            color: white;
            width: 2rem;
            height: 2rem;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
        }
        code {
            background: #f8f9fa;
            padding: 0.2rem 0.4rem;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
        }
        .success {
            color: #28a745;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📝 Form Ready to Fill</h1>
        
        <div class="info">
            <strong>✨ AI-Filled form ready!</strong><br>
            Click the button below to open the form and fill it automatically.
        </div>

        <div class="url">
            ${session.url}
        </div>

        <a href="${bookmarkletCode}" class="btn btn-primary" id="fillBookmarklet" draggable="true">
            ✨ Fill Form (Drag to Bookmarks)
        </a>
        
        <div class="info" style="margin-top:1rem;background:#fff3cd;border-left-color:#ffc107;">
            <strong>⚠️ Cross-Origin Forms</strong><br>
            For external forms, drag the button above to your bookmarks bar, then:
        </div>

        <div class="steps">
            <div class="step">
                <strong>Drag "Fill Form" to bookmarks</strong><br>
                Drag the yellow button to your browser's bookmarks bar
            </div>
            <div class="step">
                <strong>Open the form</strong><br>
                <a href="${session.url}" target="_blank" class="btn btn-secondary" style="display:inline-block;padding:0.5rem 1rem;font-size:0.9rem;">Open Form →</a>
            </div>
            <div class="step">
                <strong>Click the bookmarklet</strong><br>
                Once the form is loaded, click the bookmarklet in your bookmarks
            </div>
            <div class="step">
                <strong>Review & Submit</strong><br>
                Check the filled values and submit the form
            </div>
        </div>

        <div class="info" style="background:#e7f3ff;border-left-color:#0066cc;">
            <strong>💡 Alternative: Console Method</strong><br>
            <button class="btn btn-secondary" style="margin-top:0.5rem;" onclick="copyScript()">
                📋 Copy Script for Console
            </button>
        </div>
        
        <textarea id="scriptCode" readonly style="display:none;width:100%;height:100px;margin-top:1rem;font-family:monospace;font-size:12px;padding:0.5rem;"></textarea>
    </div>

    <script>
        const sessionData = ${JSON.stringify(session)};
        const mappings = sessionData.fieldMappings || [];
        
        // Generate console script
        const consoleScript = \`(function() {
    const mappings = \${JSON.stringify(mappings)};
    let filled = 0;
    
    for (const mapping of mappings) {
        try {
            const element = document.querySelector(mapping.selector);
            if (element) {
                if (mapping.fieldType === 'checkbox' || mapping.fieldType === 'radio') {
                    element.checked = mapping.value === 'true' || mapping.value === true;
                } else {
                    element.value = mapping.value;
                    element.dispatchEvent(new Event('input', { bubbles: true }));
                    element.dispatchEvent(new Event('change', { bubbles: true }));
                }
                filled++;
            }
        } catch (err) {
            console.error('Failed to fill:', mapping.selector, err);
        }
    }
    
    console.log('✅ Filled ' + filled + '/' + mappings.length + ' fields');
    alert('✅ Filled ' + filled + '/' + mappings.length + ' form fields!');
})();\`;

        document.getElementById('scriptCode').value = consoleScript;

        function copyScript() {
            const textarea = document.getElementById('scriptCode');
            textarea.style.display = 'block';
            textarea.select();
            document.execCommand('copy');
            
            const btn = event.target;
            const originalText = btn.innerHTML;
            btn.innerHTML = '✅ Copied! Open form and paste in console (F12)';
            btn.style.background = '#28a745';
            btn.style.color = 'white';
            
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.style.background = '';
                btn.style.color = '';
                textarea.style.display = 'none';
            }, 5000);
        }
    </script>
</body>
</html>
      `;

      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      this.logger.error('Failed to create filler page', error);
      res.status(500).send('Failed to create filler page');
    }
  }

  private generateFillerCode(mappings: any[]): string {
    return `function(){${JSON.stringify(mappings)}.forEach(m=>{try{const e=document.querySelector(m.selector);if(e){if(m.fieldType==='checkbox'||m.fieldType==='radio'){e.checked=m.value==='true'||m.value===true}else{e.value=m.value;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}))}}}catch(err){console.error(err)}})}`;
  }
}
