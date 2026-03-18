import Razorpay from 'razorpay';
import prisma from '../config/prisma';
import { encryptSecret, decryptSecret, maskKey } from '../utils/razorpayEncryption.util';

export interface RazorpayConfigDisplay {
  id: number;
  keyId: string;
  keyIdMasked: string;
  hasWebhookSecret: boolean;
  isVerified: boolean;
  verifiedAt: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DecryptedRazorpayConfig {
  id: number;
  userId: number;
  keyId: string;
  keySecret: string;
  webhookSecret: string | null;
  isVerified: boolean;
  isActive: boolean;
}

class RazorpayConfigService {
  /**
   * Save or update Razorpay credentials for a user.
   * Encrypts secrets before storing.
   */
  async saveConfig(
    userId: number,
    keyId: string,
    keySecret: string,
    webhookSecret?: string
  ): Promise<RazorpayConfigDisplay> {
    const keySecretEnc = encryptSecret(keySecret);
    const webhookSecretEnc = webhookSecret ? encryptSecret(webhookSecret) : null;

    const config = await prisma.razorpayConfig.upsert({
      where: { userId },
      create: {
        userId,
        keyId,
        keySecretEnc,
        webhookSecretEnc,
        isVerified: false,
      },
      update: {
        keyId,
        keySecretEnc,
        webhookSecretEnc,
        isVerified: false, // Reset verification when credentials change
        verifiedAt: null,
      },
    });

    return this.toDisplay(config);
  }

  /**
   * Get config for display (masked secrets, no raw values).
   */
  async getConfig(userId: number): Promise<RazorpayConfigDisplay | null> {
    const config = await prisma.razorpayConfig.findUnique({ where: { userId } });
    if (!config) return null;
    return this.toDisplay(config);
  }

  /**
   * Get config with decrypted secrets (internal use only — never expose to API).
   */
  async getDecryptedConfig(userId: number): Promise<DecryptedRazorpayConfig | null> {
    const config = await prisma.razorpayConfig.findUnique({ where: { userId } });
    if (!config) return null;

    return {
      id: config.id,
      userId: config.userId,
      keyId: config.keyId,
      keySecret: decryptSecret(config.keySecretEnc),
      webhookSecret: config.webhookSecretEnc ? decryptSecret(config.webhookSecretEnc) : null,
      isVerified: config.isVerified,
      isActive: config.isActive,
    };
  }

  /**
   * Get decrypted config by config ID (for payment processing).
   */
  async getDecryptedConfigById(configId: number): Promise<DecryptedRazorpayConfig | null> {
    const config = await prisma.razorpayConfig.findUnique({ where: { id: configId } });
    if (!config) return null;

    return {
      id: config.id,
      userId: config.userId,
      keyId: config.keyId,
      keySecret: decryptSecret(config.keySecretEnc),
      webhookSecret: config.webhookSecretEnc ? decryptSecret(config.webhookSecretEnc) : null,
      isVerified: config.isVerified,
      isActive: config.isActive,
    };
  }

  /**
   * Test Razorpay credentials by making an API call.
   * Attempts to fetch orders list (count=1) — if credentials are valid, it succeeds.
   */
  async testCredentials(keyId: string, keySecret: string): Promise<{ success: boolean; message: string }> {
    try {
      const instance = new Razorpay({ key_id: keyId, key_secret: keySecret });
      // Fetch a minimal orders list to verify credentials
      await (instance.orders as any).all({ count: 1 });
      return { success: true, message: 'Razorpay credentials verified successfully' };
    } catch (error: any) {
      const msg = error?.error?.description || error?.message || 'Invalid credentials';
      return { success: false, message: msg };
    }
  }

  /**
   * Test and mark credentials as verified in the database.
   */
  async testAndVerify(userId: number): Promise<{ success: boolean; message: string }> {
    const config = await this.getDecryptedConfig(userId);
    if (!config) {
      return { success: false, message: 'No Razorpay configuration found' };
    }

    const result = await this.testCredentials(config.keyId, config.keySecret);

    if (result.success) {
      await prisma.razorpayConfig.update({
        where: { userId },
        data: { isVerified: true, verifiedAt: new Date() },
      });
    }

    return result;
  }

  /**
   * Delete config for a user.
   */
  async deleteConfig(userId: number): Promise<void> {
    await prisma.razorpayConfig.deleteMany({ where: { userId } });
  }

  /**
   * Look up the Razorpay config for an event's creator.
   * Returns null if the creator has no config, or it's not verified/active.
   */
  async getConfigForEvent(eventId: number): Promise<DecryptedRazorpayConfig | null> {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { creatorId: true },
    });
    if (!event) return null;

    const config = await prisma.razorpayConfig.findUnique({
      where: { userId: event.creatorId },
    });

    if (!config || !config.isVerified || !config.isActive) return null;

    return {
      id: config.id,
      userId: config.userId,
      keyId: config.keyId,
      keySecret: decryptSecret(config.keySecretEnc),
      webhookSecret: config.webhookSecretEnc ? decryptSecret(config.webhookSecretEnc) : null,
      isVerified: config.isVerified,
      isActive: config.isActive,
    };
  }

  /**
   * Convert a raw DB record to a display-safe format (masked secrets).
   */
  private toDisplay(config: any): RazorpayConfigDisplay {
    return {
      id: config.id,
      keyId: config.keyId,
      keyIdMasked: maskKey(config.keyId),
      hasWebhookSecret: !!config.webhookSecretEnc,
      isVerified: config.isVerified,
      verifiedAt: config.verifiedAt,
      isActive: config.isActive,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    };
  }
}

export const razorpayConfigService = new RazorpayConfigService();
