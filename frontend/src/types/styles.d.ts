/**
 * Lets TypeScript resolve stylesheet side-effect imports when a file is opened
 * outside Next.js' configured TypeScript project (for example, in an editor
 * working-tree view).
 */
declare module '*.css';
