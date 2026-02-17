import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { EmailService } from './email.service';
import { PrismaService } from 'src/prisma.service';

@Module({
    imports: [
        MailerModule.forRoot({
            transport: {
                host: process.env.EMAIL_HOST || 'smtp.gmail.com',
                port: 587,
                secure: false, // Use STARTTLS
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
                tls: {
                    rejectUnauthorized: false
                },
                connectionTimeout: 5000, // 5 second timeout
                greetingTimeout: 5000,
            },
            defaults: {
                from: `"Store Master" <${process.env.EMAIL_USER}>`,
            },
        }),
    ],
    providers: [EmailService, PrismaService],
    exports: [EmailService],
})
export class EmailModule {}
