import * as fs from 'fs';
import * as path from 'path';

const authConfigPath = path.join(process.cwd(), 'src/config/auth-config.ts');
const apiConfigPath = path.join(process.cwd(), 'src/config/api-config.ts');

const authConfigTemplate = `export const authorizedEmails: string[] = [];\n`;
const apiConfigTemplate = `export const youtubeApiKey = 'YOUR_YOUTUBE_API_KEY_HERE';\n`;

if (!fs.existsSync(path.dirname(authConfigPath))) {
  fs.mkdirSync(path.dirname(authConfigPath), { recursive: true });
}

if (!fs.existsSync(authConfigPath)) {
  fs.writeFileSync(authConfigPath, authConfigTemplate);
}
if (!fs.existsSync(apiConfigPath)) {
  fs.writeFileSync(apiConfigPath, apiConfigTemplate);
}
