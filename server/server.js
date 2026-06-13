const dotenv = require('dotenv');
dotenv.config();

console.log('ADMIN_INVITE_KEY:', process.env.ADMIN_INVITE_KEY);

const app = require('./src/app');
const { seedShowcaseData } = require('./src/api/services/showcaseSeeder');

const PORT = process.env.PORT || 3001;

app.listen(PORT, async () => {
  console.log(`Tech Treasure Hunt server running on port ${PORT}`);
  // Seed default questions and demo credentials on startup
  await seedShowcaseData();
});


