const dotenv = require('dotenv');
dotenv.config();

console.log('ADMIN_INVITE_KEY:', process.env.ADMIN_INVITE_KEY);

const app = require('./src/app');

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Tech Treasure Hunt server running on port ${PORT}`);
});


