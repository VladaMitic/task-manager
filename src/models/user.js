const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Task = require("./task");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
    trim: true,
    lowercase: true,
    validate(value) {
      if (!validator.isEmail(value)) {
        throw new Error("Email is not valid");
      }
    },
  },
  age: {
    type: Number,
    default: 0,
    validate(value) {
      if (value < 0) {
        throw new Error("Age mast be greater than 0");
      }
    },
  },
  password: {
    type: String,
    required: true,
    trim: true,
    minlength: 8,
    validate(value) {
      if (value.toLowerCase().includes("password")) {
        throw new Error("Password can not contain word password");
      }
    },
  },
  tokens: [
    {
      token: {
        type: String,
        required: true,
      },
    },
  ],
  avatar: {
    type: Buffer
  }
}, {
  timestamps: true,
});

userSchema.virtual('tasks', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'owner'
});

userSchema.methods.toJSON = function () { //mora da bude sihroma, jer bi kao asihrona vratila promis, a ne podatke o useru
  const user = this;
  //pretvara podatke u raw objekat u kome su atactovani podaci usera. Ovo removuje podatke koje mongoose embeduje po difoltu kada cuva podatke (sustinski se dobijaju isti podaci samo sto mozemod a sa njima manipulisemo kao da su objekat)
  const userObject = user.toObject();

  delete userObject.password; //brisemo iz objekta properti password
  delete userObject.tokens; //brisemo iz objekta properti u koji se cuva arej tokena
  delete userObject.avatar; //brisemo iz objekta properti avatar, jer je preveliki, za avaar (buffer slike) dobro je imati zasebnu rutu

  return userObject;
};

userSchema.methods.generateAuthToken = async function () {
  //poziva se nad trenutnim userom, pa nam treba bind za this, koji je sustinski trenutni user
  const user = this;
  const token = jwt.sign({ _id: user._id.toString() }, "thisismysecret"); //id je ojekat, a sa toString s epetvara u string (na prethodnom se id direktno prosledjivao kao parametar, a posto je objekat nije bilo problema, ovde se prosledjuje kao vrednost propertija, te da se nije pretvorilo u string bilo bi da je properti _id jednak objektu)
  user.tokens = user.tokens.concat({ token }); //dodamo novi token u bazu (kao objekat) na vec postojece tokene (konkatenejtujemo)
  await user.save();
  return token;
};

userSchema.statics.findByCredantials = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error("Unable to login!");
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new Error("Unable to login!");
  }

  return user;
};

userSchema.pre("save", async function (next) {
  const user = this;
  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  next();
});

userSchema.pre('remove', async function(next) {
  const user = this;
  await Task.deleteMany({ owner: user.id });
  next();
});

const User = mongoose.model("User", userSchema);

module.exports = User;
