import { join, resolve } from 'path';

export const ROOT_DIR = process.cwd();

/**
 * Allow data directories to live on a Render persistent disk without changing
 * the application's code directory. When these variables are absent, local
 * development keeps the original paths.
 */
export const INSTANCE_DIR = process.env.INSTANCE_DIR ? resolve(process.env.INSTANCE_DIR) : join(ROOT_DIR, 'instances');
export const SRC_DIR = join(ROOT_DIR, 'src');
export const STORE_DIR = process.env.STORE_DIR ? resolve(process.env.STORE_DIR) : join(ROOT_DIR, 'store');
export const AUTH_DIR = join(STORE_DIR, 'auth');
