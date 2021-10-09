const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../../src/models/user");
const Task = require("../../src/models/task");

//SETOVANJE PODATAKA ZA TEST/FIKSNOG USERA (mozemo da kreiramo vise, za testiranje use ruta je dovoljno jedan, ali za druge resurse koji s ekreiraju kroz usera, dobro je da imamo vise usera da bi ispitivali)
const userOneId = new mongoose.Types.ObjectId(); //generisemo id test, fiksnog usera. Zasebna varijabla jer se koristi za generisanje id usera i za kreiranje tokena usera pri kreiranju test (fiksnog) usera
const userOne = {
  //fiksni, test user
  _id: userOneId,
  name: "Vlada",
  email: "vlada@example.com",
  password: "Promeni01",
  tokens: [
    {
      token: jwt.sign({ _id: userOneId }, process.env.JWT_SECRET),
    },
  ],
};

const userTwoId = new mongoose.Types.ObjectId(); //generisemo id test, fiksnog usera. Zasebna varijabla jer se koristi za generisanje id usera i za kreiranje tokena usera pri kreiranju test (fiksnog) usera
const userTwo = {
  //fiksni, test user
  _id: userTwoId,
  name: "Sandra",
  email: "sandra@example.com",
  password: "Promeni02",
  tokens: [
    {
      token: jwt.sign({ _id: userTwoId }, process.env.JWT_SECRET),
    },
  ],
};

//SETOVANJE PODATAKA ZA TEST FIKSE OSTALE RESURSE (pravi s enekoliko za svakir esurs, koji odgovaraju razlicitim situacijama u kojima s epodaci mogu naci)
const taskOne = {
  _id: new mongoose.Types.ObjectId(), //nema potrebe izdvojeno id, jer nam nece trebati i za druge stvari (kod usera je trebao za token. Iako ce baza automatski da kreira id, mi ga setujemo ovde da bi mogli id-u da pristupimo preko taskOne objekta,a ne da iscitavamo iz baze
  description: "First Task",
  completed: false, //morajud a se setuju i difoltna polja, jer s eovo ne kreira kroz nasu mongose schemu, vec rucno
  owner: userOneId,
};

const taskTwo = {
  _id: new mongoose.Types.ObjectId(),
  description: "Second Task",
  completed: true,
  owner: userOneId,
};

const taskThree = {
  _id: new mongoose.Types.ObjectId(),
  description: "Third Task",
  completed: true,
  owner: userTwoId,
};

//SETOVANJE BAZE PODATAKA NA OSNOVU PODATAKA O USERU I RESURSIMA
const setupDatbase = async () => {
  //pravi se funkcija koja setuje bazu podataka za test (cisti postojecu i kreira fiktivnog test usere )
  await User.deleteMany();
  await Task.deleteMany();
  await new User(userOne).save();
  await new User(userTwo).save();
  await new Task(taskOne).save();
  await new Task(taskTwo).save();
  await new Task(taskThree).save();
};

module.exports = {
  userOneId,
  userOne,
  userTwoId,
  userTwo,
  taskOne,
  taskTwo,
  taskThree,
  setupDatbase,
};
