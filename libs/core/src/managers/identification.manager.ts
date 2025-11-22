export class IDManager {
  static generateId(length: number): string {
    const charSet =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
    let result = '';
    const n = charSet.length;
    for (let i = 0; i < length; ++i) {
      result += charSet.charAt(Math.floor(Math.random() * n));
    }

    return result;
  }

  static generateUUID(length: number): string {
    const charSet =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
    let result = '';
    const n = charSet.length;
    for (let i = 0; i < length; ++i) {
      result += charSet.charAt(Math.floor(Math.random() * n));
    }

    return result;
  }

  static generateOTP(length: number): string {
    const charSet = '1234567890';
    let result = '';
    const n = charSet.length;
    for (let i = 0; i < length; ++i) {
      result += charSet.charAt(Math.floor(Math.random() * n));
    }

    return result;
  }

  static maskString(input: string): string {
    if (input.length <= 2) {
      return input;
    }

    const firstChar = input[0];
    const lastChar = input[input.length - 1];
    const maskedMiddle = '***';

    return `${firstChar?.toLowerCase()}${maskedMiddle}${lastChar?.toLowerCase()}`;
  }
}
