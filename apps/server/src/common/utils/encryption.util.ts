import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const KEY = process.env.ENCRYPTION_KEY || 'tongquetai_default_key_32chars_long!!';
const IV_LENGTH = 16;

export class EncryptionService {
  private static getKey(): Buffer {
    return crypto.scryptSync(KEY, 'salt', 32);
  }

  static encrypt(text: string): string {
    if (!text) return text;
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = this.getKey();
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  static decrypt(encryptedText: string): string {
    if (!encryptedText || !encryptedText.includes(':')) return encryptedText;
    const [ivHex, encrypted] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const key = this.getKey();
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  static maskPhone(phone: string): string {
    if (!phone || phone.length < 7) return phone;
    return phone.substring(0, 3) + '****' + phone.substring(phone.length - 4);
  }

  static maskIdCard(idCard: string): string {
    if (!idCard || idCard.length < 8) return idCard;
    return idCard.substring(0, 4) + '**********' + idCard.substring(idCard.length - 4);
  }

  static maskName(name: string): string {
    if (!name || name.length < 2) return name;
    return name.substring(0, 1) + '*'.repeat(name.length - 1);
  }
}
