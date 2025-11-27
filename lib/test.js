// test-conn.js
const mongoose = require("mongoose");
const uri = "mongodb+srv://divansh:TYu6Gl2c8mQpmYGx@baseclustor.xy9sazg.mongodb.net/moodmap?retryWrites=true&w=majority";
mongoose.connect(uri).then(() => {
  console.log("connected");
  process.exit(0);
}).catch(err => {
  console.error("connect error:", err);
  process.exit(1);
});
