import { NextRequest, NextResponse } from 'next/server';
import { sendLoginAlert, parseUserAgent } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Read env vars at request time, not at build time
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.error('Admin credentials not configured:', {
        hasEmail: !!adminEmail,
        hasPassword: !!adminPassword,
      });
      return NextResponse.json(
        { error: 'Server configuration error - admin credentials not set' },
        { status: 500 }
      );
    }

    if (email === adminEmail && password === adminPassword) {
      const response = NextResponse.json(
        { success: true, message: 'Authentication successful' },
        { status: 200 }
      );

      response.cookies.set('auth_token', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      });

      const ipAddress =
        request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
        request.headers.get('x-real-ip') ||
        'Unknown';
      const userAgent = request.headers.get('user-agent') || 'Unknown';
      const referrer = request.headers.get('referer') || '';
      const timestamp = new Date().toLocaleString('en-US', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'full',
        timeStyle: 'long',
      });
      const { browser, os } = parseUserAgent(userAgent);

      sendLoginAlert({ ipAddress, userAgent, browser, os, timestamp, referrer }).catch((err) =>
        console.error('Login alert email failed:', err)
      );

      return response;
    }

    return NextResponse.json(
      { error: 'Invalid email or password' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An error occurred during authentication' },
      { status: 500 }
    );
  }
}
