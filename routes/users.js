const mongoose = require('mongoose')
const plm = require('passport-local-mongoose')

mongoose.connect("mongodb://127.0.0.1:27017/pinterest")

const userSchema = mongoose.Schema({
  username: {
    type: String,
    unique: true
  },
  name: {
    type: String,
  },
  email: {
    type: String,
    unique: true
  },
  password: String,
  profileImage: String,
  contact: {
    type: Number,
    unique: true
  },
  boards: {
    type:Array,
    default:[]
  },
  posts:[{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'posts'
  }]
})

userSchema.plugin(plm)

module.exports = mongoose.model("user",userSchema)