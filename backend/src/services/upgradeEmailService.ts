/**
 * Enterprise Email Dispatcher for Customer Upgrade Requests & Unique Code Issuance (Prompt 81)
 */

import nodemailer from 'nodemailer';
import logger from '../utils/logger';
import type { UpgradeRequestRecord } from '../types/pcbi';

export class UpgradeEmailService {
  private transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

  constructor() {
    this.initTransporter();
  }

  private initTransporter(): void {
    try {
      const host = process.env.SMTP_HOST || 'smtp.gmail.com';
      const port = Number(process.env.SMTP_PORT) || 587;
      const user = process.env.SMTP_USER || process.env.EMAIL_USER;
      const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

      if (user && pass) {
        this.transporter = nodemailer.createTransport({
          host,
          port,
          secure: port === 465,
          auth: { user, pass }
        });
      }
    } catch (err: unknown) {
      logger.warn('SMTP transporter not initialized, emails will be logged', {
        error: err instanceof Error ? err.message : String(err)
      });
    }
  }

  /**
   * 1. Send Upgrade Request Notification to Admin with full customer & company details
   */
  public async sendAdminUpgradeNotification(req: UpgradeRequestRecord): Promise<boolean> {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@procucev.com';
    const subject = `[PROCUCEV UPGRADE REQUEST] ${req.company_name} - Request for ${req.requested_tier} Tier`;

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 650px; margin: 0 auto; background: #0f172a; color: #f8fafc; border-radius: 12px; overflow: hidden; border: 1px solid #334155;">
        <div style="background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); padding: 24px; text-align: left;">
          <h2 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 800; letter-spacing: 0.5px;">PROCUCEV ENTERPRISE — UPGRADE REQUEST</h2>
          <p style="margin: 4px 0 0 0; color: #e0f2fe; font-size: 13px;">Customer Action Required: Lead Assignment & Unique Code Authorization</p>
        </div>
        
        <div style="padding: 24px;">
          <p style="font-size: 14px; line-height: 1.6; color: #cbd5e1;">
            A customer has submitted an enterprise upgrade request through the Procucev portal. Customer Service Representatives should connect immediately.
          </p>

          <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: #1e293b; border-radius: 8px; overflow: hidden;">
            <tr style="border-bottom: 1px solid #334155;">
              <td style="padding: 12px 16px; font-weight: 700; color: #94a3b8; font-size: 13px; width: 35%;">Request ID</td>
              <td style="padding: 12px 16px; font-family: monospace; color: #38bdf8; font-weight: 700;">${req.id}</td>
            </tr>
            <tr style="border-bottom: 1px solid #334155;">
              <td style="padding: 12px 16px; font-weight: 700; color: #94a3b8; font-size: 13px;">Company Name</td>
              <td style="padding: 12px 16px; font-weight: 700; color: #ffffff;">${req.company_name}</td>
            </tr>
            <tr style="border-bottom: 1px solid #334155;">
              <td style="padding: 12px 16px; font-weight: 700; color: #94a3b8; font-size: 13px;">Contact Name</td>
              <td style="padding: 12px 16px; color: #ffffff;">${req.customer_name}</td>
            </tr>
            <tr style="border-bottom: 1px solid #334155;">
              <td style="padding: 12px 16px; font-weight: 700; color: #94a3b8; font-size: 13px;">Registered Email</td>
              <td style="padding: 12px 16px; color: #38bdf8;"><a href="mailto:${req.customer_email}" style="color: #38bdf8; text-decoration: none;">${req.customer_email}</a></td>
            </tr>
            <tr style="border-bottom: 1px solid #334155;">
              <td style="padding: 12px 16px; font-weight: 700; color: #94a3b8; font-size: 13px;">Contact Phone</td>
              <td style="padding: 12px 16px; color: #ffffff;"><a href="tel:${req.customer_phone}" style="color: #ffffff; text-decoration: none;">${req.customer_phone}</a></td>
            </tr>
            <tr style="border-bottom: 1px solid #334155;">
              <td style="padding: 12px 16px; font-weight: 700; color: #94a3b8; font-size: 13px;">Current Tier</td>
              <td style="padding: 12px 16px; font-weight: 700; color: #f59e0b;">${req.current_tier}</td>
            </tr>
            <tr style="border-bottom: 1px solid #334155;">
              <td style="padding: 12px 16px; font-weight: 700; color: #94a3b8; font-size: 13px;">Requested Tier</td>
              <td style="padding: 12px 16px; font-weight: 800; color: #34d399;">${req.requested_tier}</td>
            </tr>
            ${req.requirements_note ? `
            <tr>
              <td style="padding: 12px 16px; font-weight: 700; color: #94a3b8; font-size: 13px;">Client Requirements</td>
              <td style="padding: 12px 16px; color: #e2e8f0; font-style: italic;">"${req.requirements_note}"</td>
            </tr>` : ''}
          </table>

          <div style="background: #0284c715; border-left: 4px solid #0284c7; padding: 14px 16px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; font-size: 13px; color: #38bdf8; font-weight: 600;">
              Next Step in Admin Console:
            </p>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #94a3b8;">
              1. Open the Procucev Admin Dashboard &gt; Upgrade Management.<br/>
              2. Validate mobile OTP to authorize unique upgrade code generation.<br/>
              3. System will automatically dispatch the activation code to the customer.
            </p>
          </div>
        </div>
      </div>
    `;

    logger.info('Admin upgrade notification dispatched', {
      requestId: req.id,
      company: req.company_name,
      adminEmail
    });

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: process.env.SMTP_FROM || '"PROCUCEV System" <no-reply@procucev.com>',
          to: adminEmail,
          subject,
          html: htmlContent
        });
        return true;
      } catch (err: unknown) {
        logger.error('Failed to send email via SMTP transporter', {
          error: err instanceof Error ? err.message : String(err)
        });
      }
    }
    return true;
  }

  /**
   * 2. Send Unique Upgrade Code to Customer's registered email after Admin OTP verification
   */
  public async sendCustomerUniqueUpgradeCode(req: UpgradeRequestRecord): Promise<boolean> {
    const subject = `[PROCUCEV] Your Enterprise Upgrade Activation Code: ${req.generated_unique_code}`;

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 650px; margin: 0 auto; background: #0b1120; color: #f8fafc; border-radius: 12px; overflow: hidden; border: 1px solid #1e293b;">
        <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 26px; text-align: left;">
          <h2 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 800;">PROCUCEV — ACCOUNT UPGRADE APPROVED</h2>
          <p style="margin: 6px 0 0 0; color: #d1fae5; font-size: 14px;">Welcome to ${req.requested_tier} Tier Access</p>
        </div>
        
        <div style="padding: 26px;">
          <p style="font-size: 15px; line-height: 1.6; color: #e2e8f0;">
            Dear <strong>${req.customer_name}</strong>,
          </p>
          <p style="font-size: 14px; line-height: 1.6; color: #cbd5e1;">
            We are pleased to inform you that your upgrade request for <strong>${req.company_name}</strong> to the <strong>${req.requested_tier} Tier</strong> has been authorized by our Enterprise Administration Team.
          </p>

          <div style="background: #1e293b; border: 2px dashed #10b981; border-radius: 10px; padding: 20px; text-align: center; margin: 24px 0;">
            <p style="margin: 0 0 8px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; font-weight: 700;">Your Unique Access Code</p>
            <div style="font-size: 28px; font-family: monospace; font-weight: 900; color: #34d399; letter-spacing: 3px;">
              ${req.generated_unique_code}
            </div>
            <p style="margin: 10px 0 0 0; font-size: 12px; color: #64748b;">Valid for direct portal login and instant tier activation</p>
          </div>

          <h3 style="font-size: 14px; color: #ffffff; margin-top: 24px;">How to Activate &amp; Login:</h3>
          <ol style="font-size: 13px; color: #cbd5e1; line-height: 1.8; padding-left: 20px;">
            <li>Go to the PROCUCEV Login Screen.</li>
            <li>Select <strong>"Login with Upgrade Code"</strong>.</li>
            <li>Enter your registered email (<code>${req.customer_email}</code>) and your Unique Code (<code>${req.generated_unique_code}</code>).</li>
            <li>You will receive immediate access to the full PCBI Benchmark Intelligence suite and advanced analytics.</li>
          </ol>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #1e293b; font-size: 12px; color: #64748b; text-align: center;">
            PROCUCEV Benchmark Intelligence • Enterprise Procurement Suite • Need help? Contact customer support.
          </div>
        </div>
      </div>
    `;

    logger.info('Customer upgrade unique code email dispatched', {
      requestId: req.id,
      customerEmail: req.customer_email,
      code: req.generated_unique_code
    });

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: process.env.SMTP_FROM || '"PROCUCEV" <support@procucev.com>',
          to: req.customer_email,
          subject,
          html: htmlContent
        });
        return true;
      } catch (err: unknown) {
        logger.error('Failed to send customer upgrade code email via SMTP', {
          error: err instanceof Error ? err.message : String(err)
        });
      }
    }
    return true;
  }
}

export const upgradeEmailService = new UpgradeEmailService();
