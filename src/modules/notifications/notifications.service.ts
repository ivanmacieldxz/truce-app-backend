import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getMessaging, Message } from 'firebase-admin/messaging';

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const credentialsPath = this.configService.get<string>('firebase.credentialsPath');

    try {
      if (credentialsPath) {
        // Initialize with explicit credentials path
        initializeApp({
          credential: cert(credentialsPath),
        });
        this.logger.log(`Firebase Admin initialized with credentials from ${credentialsPath}`);
      } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        // Fallback to auto-discovery if env var is set but not mapped by ConfigService for some reason
        initializeApp();
        this.logger.log('Firebase Admin initialized via GOOGLE_APPLICATION_CREDENTIALS');
      } else {
        this.logger.warn('Firebase Admin NOT initialized. Missing credentials configuration.');
      }
    } catch (error) {
      this.logger.error('Failed to initialize Firebase Admin SDK', error);
    }
  }

  /**
   * Sends a push notification to a specific FCM token.
   * Fails silently so it doesn't break the main business logic (e.g., if token is invalid).
   */
  async sendPushNotification(
    token: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<void> {
    if (getApps().length === 0) {
      this.logger.warn('Cannot send push notification: Firebase Admin is not initialized.');
      return;
    }

    try {
      const message: Message = {
        notification: {
          title,
          body,
        },
        data: data || {},
        token,
      };

      const response = await getMessaging().send(message);
      this.logger.debug(`Successfully sent message: ${response}`);
    } catch (error) {
      this.logger.error(`Error sending push notification to token ${token}`, error);
    }
  }
}
