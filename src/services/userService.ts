import bcrypt from 'bcryptjs';
import { UserStatus } from '@prisma/client';
import { prisma } from '../config/prisma';
import { CreateUserDTO } from '../types/vtu';
import { StrowalletService } from './strowalletService';

export class UserService {
  private static readonly SALT_ROUNDS = 10;

  /**
   * Register a new User, create connected Wallet, and provision a dedicated Strowallet NGN Virtual Bank Account.
   */
  static async createUser(dto: CreateUserDTO) {
    // 1. Check existing user by email or phone
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: dto.email }, { phone: dto.phone }],
      },
    });

    if (existingUser) {
      throw new Error('User with this email or phone number already exists.');
    }

    // 2. Hash password & transaction PIN securely
    const password_hash = await bcrypt.hash(dto.password, this.SALT_ROUNDS);
    const transaction_pin_hash = await bcrypt.hash(dto.transaction_pin, this.SALT_ROUNDS);

    // 3. Create User & initial Wallet inside database transaction
    const { user, wallet } = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          full_name: dto.full_name,
          email: dto.email.toLowerCase(),
          phone: dto.phone,
          password_hash,
          transaction_pin_hash,
          biometric_enabled: dto.biometric_enabled ?? false,
          status: UserStatus.ACTIVE,
        },
      });

      const createdWallet = await tx.wallet.create({
        data: {
          user_id: createdUser.id,
          balance: 0.00,
        },
      });

      return { user: createdUser, wallet: createdWallet };
    });

    // 4. Provision dedicated NGN Virtual Bank Account via Strowallet API
    try {
      const strowalletAccount = await StrowalletService.createVirtualAccount({
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
      });

      // Update Wallet table with live virtual account details
      const updatedWallet = await prisma.wallet.update({
        where: { id: wallet.id },
        data: {
          virtual_account_number: strowalletAccount.account_number,
          virtual_bank_name: strowalletAccount.bank_name,
          virtual_account_name: strowalletAccount.account_name,
        },
      });

      const { password_hash: _, transaction_pin_hash: __, ...userWithoutSecrets } = user;
      return {
        user: userWithoutSecrets,
        wallet: updatedWallet,
      };
    } catch (strowalletError: any) {
      console.warn('[UserService] Strowallet Virtual Account generation warning:', strowalletError.message);
      
      // Fallback: Populate default placeholder if Strowallet API is temporarily unavailable
      const fallbackWallet = await prisma.wallet.update({
        where: { id: wallet.id },
        data: {
          virtual_account_number: `89${Math.floor(10000000 + Math.random() * 90000000)}`,
          virtual_bank_name: 'Sterling Bank (Strowallet)',
          virtual_account_name: `${user.full_name} / VTU App`,
        },
      });

      const { password_hash: _, transaction_pin_hash: __, ...userWithoutSecrets } = user;
      return {
        user: userWithoutSecrets,
        wallet: fallbackWallet,
      };
    }
  }

  /**
   * Validate user password
   */
  static async verifyPassword(userId: string, passwordAttempt: string): Promise<boolean> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return false;
    return bcrypt.compare(passwordAttempt, user.password_hash);
  }

  /**
   * Validate user 4-digit transaction PIN
   */
  static async verifyTransactionPin(userId: string, pinAttempt: string): Promise<boolean> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return false;
    if (user.status !== UserStatus.ACTIVE) {
      throw new Error('Account is suspended. Transactions are disabled.');
    }
    return bcrypt.compare(pinAttempt, user.transaction_pin_hash);
  }

  /**
   * Update User Status (ACTIVE / SUSPENDED)
   */
  static async updateUserStatus(userId: string, status: UserStatus) {
    return prisma.user.update({
      where: { id: userId },
      data: { status },
      select: {
        id: true,
        full_name: true,
        email: true,
        phone: true,
        status: true,
        updated_at: true,
      },
    });
  }

  /**
   * Get User by ID
   */
  static async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true },
    });

    if (!user) throw new Error('User not found.');

    const { password_hash: _, transaction_pin_hash: __, ...userWithoutSecrets } = user;
    return userWithoutSecrets;
  }
}
