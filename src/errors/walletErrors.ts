export class BaseWalletError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly details?: Record<string, any>;

  constructor(message: string, statusCode: number, errorCode: string, details?: Record<string, any>) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class InsufficientFundsError extends BaseWalletError {
  constructor(currentBalance: string, requiredAmount: string, userId: string) {
    super(
      `Insufficient wallet balance. Current balance: ₦${currentBalance}, Required amount: ₦${requiredAmount}`,
      400,
      'INSUFFICIENT_FUNDS',
      {
        user_id: userId,
        current_balance: currentBalance,
        required_amount: requiredAmount,
      }
    );
  }
}

export class DuplicateTransactionError extends BaseWalletError {
  constructor(reference: string) {
    super(
      `Duplicate transaction reference: '${reference}' has already been processed.`,
      409,
      'DUPLICATE_REFERENCE',
      { reference }
    );
  }
}

export class WalletNotFoundError extends BaseWalletError {
  constructor(identifier: string) {
    super(
      `Wallet not found for identifier: '${identifier}'.`,
      404,
      'WALLET_NOT_FOUND',
      { identifier }
    );
  }
}

export class ConcurrencyLockError extends BaseWalletError {
  constructor(message = 'Wallet row lock timeout or concurrent update conflict.') {
    super(message, 409, 'CONCURRENCY_LOCK_CONFLICT');
  }
}
