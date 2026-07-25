import bcrypt from 'bcryptjs';
import { UserStatus } from '@prisma/client';
import { prisma } from '../config/prisma';
import { CreateUserDTO } from '../types/vtu';

export class UserService {
  private static readonly SALT_ROUNDS = 10;

  /**
   * Register a new User and automatically create a connected Wallet.
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

    // 3. Create User & Wallet inside database transaction
    return await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
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

      // Generate virtual account placeholder (Monnify / Wema Bank simulation)
      const virtual_account_number = `99${Math.floor(10000000 + Math.random() * 90000000)}`;
      const wallet = await tx.wallet.create({
        data: {
          user_id: user.id,
          balance: 0.00,
          virtual_account_number,
          virtual_bank_name: 'Wema Bank (VTU Auto-Bank)',
          virtual_account_name: `${user.full_name} / VTU App`,
        },
      });

      const { password_hash: _, transaction_pin_hash: __, ...userWithoutSecrets } = user;
      return {
        user: userWithoutSecrets,
        wallet,
      };
    });
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
