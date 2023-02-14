const mongoose = require('mongoose');
const dotenv = require('dotenv');
process.on('uncaughtException', (err) => {
  console.log(err.name, err.message);
  console.log('Uncaught Exception  Shutting down...');
  process.exit(1);
});
dotenv.config({ path: `./config.env` });
const app = require('./app');
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABSE_PASSWORD
);

// const DB = process.env.DATABASE;
// mongoose.connect(process.env.DATABASE_LOCAL, {
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => console.log('DB connection successful'));

const port = parseInt(process.env.PORT || 8000);
const server = app.listen(port, () => {
  console.log(`running on port ${port}`);
});

process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('Unhandeled Rejection Shutting down...');
  server.close(() => {
    process.exit(1);
  });
});
