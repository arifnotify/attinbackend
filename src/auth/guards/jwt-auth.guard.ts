import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // ১. রিকোয়েস্ট ক্যানডিডেট হ্যান্ডেল করা
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  // ২. টোকেন ভ্যালিডেশন এবং ইউজার ব্লক চেক
  handleRequest(err: any, user: any, info: any) {
    // ❌ টোকেন মিসিং বা ইনভ্যালিড হলে
    if (err || !user) {
      throw (
        err ||
        new UnauthorizedException('আপনার সেশনটি মেয়াদোত্তীর্ণ বা অবৈধ টোকেন!')
      );
    }

    // ⛔ ইউজার ব্লকড থাকলে API এক্সেস করতে দেওয়া হবে না (Forbidden 403 Error)
    if (user.isBlocked) {
      throw new ForbiddenException(
        `আপনার অ্যাকাউন্টটি স্থগিত করা হয়েছে। কারণ: ${
          user.blockReason || 'নিয়ম লঙ্ঘনের কারণে আপনার অ্যাকাউন্ট ব্লকড।'
        }`,
      );
    }

    // ✅ সব ঠিক থাকলে ইউজার অবজেক্ট রিকোয়েস্টে পাঠাবে
    return user;
  }
}