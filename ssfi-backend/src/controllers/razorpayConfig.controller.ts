import { Request, Response, NextFunction } from 'express';
import { razorpayConfigService } from '../services/razorpayConfig.service';

class RazorpayConfigController {
  /**
   * GET /api/v1/razorpay-config
   * Get current Razorpay config status (masked secrets).
   */
  async getConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ status: 'error', message: 'Unauthorized' });

      const config = await razorpayConfigService.getConfig(userId);

      return res.json({
        status: 'success',
        data: config || null,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/razorpay-config
   * Save or update Razorpay credentials.
   */
  async saveConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ status: 'error', message: 'Unauthorized' });

      const { keyId, keySecret, webhookSecret } = req.body;

      if (!keyId || !keySecret) {
        return res.status(400).json({
          status: 'error',
          message: 'Razorpay Key ID and Key Secret are required',
        });
      }

      const config = await razorpayConfigService.saveConfig(userId, keyId, keySecret, webhookSecret);

      return res.json({
        status: 'success',
        message: 'Razorpay credentials saved. Please test your integration.',
        data: config,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/razorpay-config/test
   * Test credentials against Razorpay API and mark as verified if successful.
   */
  async testConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ status: 'error', message: 'Unauthorized' });

      const result = await razorpayConfigService.testAndVerify(userId);

      return res.json({
        status: result.success ? 'success' : 'error',
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/razorpay-config
   * Remove Razorpay configuration.
   */
  async deleteConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ status: 'error', message: 'Unauthorized' });

      await razorpayConfigService.deleteConfig(userId);

      return res.json({
        status: 'success',
        message: 'Razorpay configuration removed',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const razorpayConfigController = new RazorpayConfigController();
