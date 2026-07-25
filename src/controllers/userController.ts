import { Request, Response } from 'express';
import { UserService } from '../services/userService';
import { UserStatus } from '@prisma/client';

export class UserController {
  static async register(req: Request, res: Response) {
    try {
      const { full_name, email, phone, password, transaction_pin, biometric_enabled } = req.body;

      if (!full_name || !email || !phone || !password || !transaction_pin) {
        return res.status(400).json({ success: false, message: 'Missing required registration fields.' });
      }

      if (transaction_pin.length !== 4 || !/^\d{4}$/.test(transaction_pin)) {
        return res.status(400).json({ success: false, message: 'Transaction PIN must be a 4-digit numeric string.' });
      }

      const result = await UserService.createUser({
        full_name,
        email,
        phone,
        password,
        transaction_pin,
        biometric_enabled,
      });

      return res.status(201).json({
        success: true,
        message: 'User registered successfully and wallet created.',
        data: result,
      });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getProfile(req: Request, res: Response) {
    try {
      const userId = req.params.id;
      const user = await UserService.getUserById(userId);
      return res.status(200).json({ success: true, data: user });
    } catch (error: any) {
      return res.status(404).json({ success: false, message: error.message });
    }
  }

  static async updateStatus(req: Request, res: Response) {
    try {
      const userId = req.params.id;
      const { status } = req.body;

      if (!Object.values(UserStatus).includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status value.' });
      }

      const updatedUser = await UserService.updateUserStatus(userId, status);
      return res.status(200).json({
        success: true,
        message: `User status updated to ${status}.`,
        data: updatedUser,
      });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }
}
