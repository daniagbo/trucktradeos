import 'dotenv/config';

// Ensure SESSION_SECRET is set before importing modules that read it at import time.
process.env.SESSION_SECRET ||= 'vitest_session_secret_32chars_minimum____';

