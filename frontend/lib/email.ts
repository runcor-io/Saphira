/**
 * Email System
 * Uses Resend for sending transactional emails
 */

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
}

const DEFAULT_FROM_EMAIL = 'Saphire AI <onboarding@resend.dev>';

/**
 * Send email using Resend
 */
export async function sendEmail(options: EmailOptions): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  const { to, subject, html, text, from = DEFAULT_FROM_EMAIL } = options;

  try {
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html: html || '',
      text: text || '',
    } as any);

    if (error) {
      console.error('Error sending email:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      messageId: data?.id,
    };
  } catch (error) {
    console.error('Exception sending email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send welcome email to new users
 */
export async function sendWelcomeEmail(
  userEmail: string,
  userName: string
): Promise<{ success: boolean; error?: string }> {
  const subject = 'Welcome to Saphire AI - Your Interview Preparation Starts Now!';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Saphire AI</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb;">Welcome to Saphire AI!</h1>
        </div>
        
        <p>Hi ${userName},</p>
        
        <p>Welcome to Saphire AI, your personal AI-powered interview and presentation preparation platform. We're excited to help you ace your next big opportunity!</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Here's what you can do:</h3>
          <ul>
            <li>Practice with our AI Nigerian corporate interviewers</li>
            <li>Simulate presentation scenarios with realistic panel members</li>
            <li>Get detailed feedback on your responses</li>
            <li>Track your progress over time</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
             style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Start Practicing
          </a>
        </div>
        
        <p>Ready to get started? Head to your dashboard and try your first practice interview!</p>
        
        <p>If you have any questions, just reply to this email.</p>
        
        <p>Best regards,<br>The Saphire AI Team</p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="font-size: 12px; color: #6b7280;">
          You're receiving this email because you signed up for Saphire AI.
        </p>
      </div>
    </body>
    </html>
  `;

  const text = `
    Welcome to Saphire AI!
    
    Hi ${userName},
    
    Welcome to Saphire AI, your personal AI-powered interview and presentation preparation platform.
    
    Here's what you can do:
    - Practice with our AI Nigerian corporate interviewers
    - Simulate presentation scenarios with realistic panel members
    - Get detailed feedback on your responses
    - Track your progress over time
    
    Start practicing: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard
    
    Best regards,
    The Saphire AI Team
  `;

  const result = await sendEmail({
    to: userEmail,
    subject,
    html,
    text,
  });

  return {
    success: result.success,
    error: result.error,
  };
}

/**
 * Send interview completion email
 */
export async function sendInterviewCompletionEmail(
  userEmail: string,
  userName: string,
  interviewId: string,
  score: number
): Promise<{ success: boolean }> {
  const subject = 'Your Interview Practice Session is Complete!';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2563eb;">Great Job, ${userName}!</h1>
        
        <p>You've completed your interview practice session.</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <h2 style="margin: 0;">Your Score: ${score}/10</h2>
        </div>
        
        <p>View your detailed feedback and see where you can improve:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/interviews/${interviewId}" 
             style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Results
          </a>
        </div>
        
        <p>Keep practicing to improve your skills!</p>
        
        <p>Best regards,<br>The Saphire AI Team</p>
      </div>
    </body>
    </html>
  `;

  const result = await sendEmail({
    to: userEmail,
    subject,
    html,
  });

  return { success: result.success };
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  userEmail: string,
  resetToken: string
): Promise<{ success: boolean }> {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${resetToken}`;
  
  const subject = 'Reset Your Saphire AI Password';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2563eb;">Password Reset Request</h1>
        
        <p>You requested to reset your password. Click the link below to set a new password:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Reset Password
          </a>
        </div>
        
        <p>Or copy and paste this link in your browser:</p>
        <p style="word-break: break-all; background-color: #f3f4f6; padding: 10px; border-radius: 4px;">${resetUrl}</p>
        
        <p style="color: #6b7280; font-size: 14px;">
          This link expires in 24 hours. If you didn't request this, please ignore this email.
        </p>
        
        <p>Best regards,<br>The Saphire AI Team</p>
      </div>
    </body>
    </html>
  `;

  const result = await sendEmail({
    to: userEmail,
    subject,
    html,
  });

  return { success: result.success };
}
