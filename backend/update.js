const { execSync } = require('child_process');
execSync('npx wrangler d1 execute suhhp-db --local --command="UPDATE users SET password_hash = \'$2b$10$tOerUSDuoJKzNXQVNdd3peJ1HMbpGhs5UksKjghQHyTCPJHSLVj5G\' WHERE email = \'newtest@test.com\'"', { stdio: 'inherit' });
