import { MailerService } from "@nestjs-modules/mailer";
import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma.service";

@Injectable()
export class EmailService {
    constructor(
        private readonly mailerService: MailerService,
        private readonly prismaService: PrismaService,
    ) {}

    generateOtp(): string {
        return Math.random().toString().slice(2, 8);
    }

    async sendOtpEmail(to: string, otp: string) {
        const htmlTemplate = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f172a; }
                .container { max-width: 600px; margin: 0 auto; background: #1a202c; border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; overflow: hidden; }
                .header { background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%); padding: 32px 24px; text-align: center; }
                .header h1 { color: white; margin: 0; font-size: 24px; font-weight: 600; }
                .content { padding: 40px 24px; text-align: center; }
                .otp-box { background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; padding: 24px; margin: 24px 0; }
                .otp-code { font-size: 32px; font-weight: 700; color: #10b981; letter-spacing: 4px; font-family: 'Courier New', monospace; }
                .message { color: #cbd5e1; font-size: 14px; line-height: 1.6; margin: 16px 0; }
                .warning { color: #f97316; font-size: 12px; margin-top: 16px; }
                .footer { background: rgba(255,255,255,0.05); padding: 16px 24px; text-align: center; color: #94a3b8; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Store Master</h1>
                </div>
                <div class="content">
                    <h2 style="color: white; margin-top: 0;">Verify Your Email</h2>
                    <p class="message">Your one-time password (OTP) is:</p>
                    <div class="otp-box">
                        <div class="otp-code">${otp}</div>
                    </div>
                    <p class="message">This OTP will expire in <strong>10 minutes</strong></p>
                    <p class="warning">Never share this code with anyone. We will never ask for it.</p>
                </div>
                <div class="footer">
                    <p style="margin: 0;">© 2025 Store Master. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        `;

        await this.mailerService.sendMail({
            to,
            subject: '🔐 Store Master - Your OTP Code',
            html: htmlTemplate,
        });
    }

    async sendOtpAndStore(email: string): Promise<string> {
        const otp = this.generateOtp();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        await this.prismaService.otp.upsert({
            where: { email },
            update: { code: otp, expiresAt, consumed: false },
            create: { email, code: otp, expiresAt },
        });

        await this.sendOtpEmail(email, otp);

        return otp;
    }

    async verifyOtp(email: string, otp: string): Promise<boolean> {
        const record = await this.prismaService.otp.findUnique({ where: { email } });

        if (!record) {
            return false;
        }

        if (record.consumed) {
            return false;
        }

        if (record.expiresAt.getTime() < Date.now()) {
            return false;
        }

        if (record.code !== otp) {
            return false;
        }

        await this.prismaService.otp.update({
            where: { email },
            data: { consumed: true },
        });

        return true;
    }
}