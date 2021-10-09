const request = require("supertest");
const app = require("../src/app");
const User = require("../src/models/user");
const { userOneId, userOne, setupDatbase } = require("./fixtures/db"); //ukljucuju se delovi db fajla koji su nam potrebni (id usera, test user i fnkcija za setapovanje baze)

beforeEach(setupDatbase);

test("Should signup new user", async () => {
  const response = await request(app) //rsponse supertest requesta se cuva u varijablu da bi ga kasnije koristili. Treba uvek imati u vidu sta respons rute vraca
    .post("/users")
    .send({
      name: "test",
      email: "test@example.com",
      password: "Promeni01",
    })
    .expect(201);

  //assertion da provravamo da li je user kreiran u bazi
  const user = await User.findById(response.body.user._id); //koristi se id koji je vracen risponsom, da bi se po nejmu u bazi pronasao user i utvrdilo da li je kreiran (moramo imati u vidu sta sign up vraca)
  expect(user).not.toBeNull(); //ocekujemo usera da ne bude null (not je metoda u chainu koja revertuje narednu metodu, o ovom slucaju da bude null revertune da ne bude)

  //assertion proverava da li su odredjeni podaci iz responsa (njegovog bodija) ono sto treba da budu
  expect(response.body).toMatchObject({
    //proveravamo da li podaci koji su kreirani u bazu (objekat usera), sadrzi propertije koji su precizirani metodom toMatchObject. Respons body mzoe da sadrzi i vise propertija, ali oni koji su precizirani metodom morajubiti obavezno sadrzani i da mecuju vrednost
    user: {
      //ovde treba voditi racuna sta vraca sign up ruta (vraca objekat sa user i token objektom, a nas interesuje user)
      name: "test",
      email: "test@example.com",
    },
    token: user.tokens[0].token, //proverava da li se u areju tokena nalazi token koji je kreiran kriranjem usera
  });

  //assertion za proveru passworda (enkripcije)
  expect(user.password).not.toBe("Promeni01"); //proverava se d ali je enkripovan password, odnosnod a slucajno nije u plain tekstu
});

test("Should login existing user", async () => {
  const response = await request(app)
    .post("/users/login")
    .send({
      email: userOne.email,
      password: userOne.password,
    })
    .expect(200);

  const user = await User.findById(userOneId); //koristi se id kojim je kreiran user, da bi se po nejmu u bazi pronasao user u bazi
  //validacija assertom da li je novi token sacuvan u bazu, odnosno da li je token koji je u bazi jednak onome koji s edobije responsom
  expect(response.body.token).toBe(user.tokens[1].token); //proverava se da li je drugi por edu token u areju tokena u abzi jednak tokenu koji se salje responsom (prvi token je u bazi sacuvan pri kreiranju usera - userOne, a pri loginu se cuva drugi)
});

test("Should not login nonexistent user", async () => {
  await request(app)
    .post("/users/login") //pravimo request ka login ruti korsicenjem supertest
    .send({
      email: userOne.email, //neki od podataka je drugaciji u odnosu an fiksnog usera
      password: "Not correct pass",
    })
    .expect(400); //status kod koji bekendom saljemo da uspesan login
});

test("Should get profile for user", async () => {
  //za dobijanje autentikovene rute o profilu korisnika, pravimo sa supertestom http request ka ruti za dobijanje profile (getMe)
  await request(app)
    .get("/users/me")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`) //setujemo auth header supertest requesta na berier token koji je sacuvan u bazi (ovo je varijanta kada se okeni cuvaju u bazi u suprotnom bi trebalo drugacije izvesti test)
    .send()
    .expect(200);
});

test("Should not get profile for unauthenticated user", async () => {
  //za dobijanje autentikovene rute o profilu korisnika, pravimo sa supertestom http request ka ruti za dobijanje profile (getMe)
  await request(app)
    .get("/users/me") //saljemo zahtev, ali bez setovanja hedera (znaci nema tokena usera i trebalo bid a ne moze da se autentikuje)
    .send()
    .expect(401); //status mora biti onaj koji je i u pravoj ruti
});

test("Should delete profile for user", async () => {
  //za dobijanje autentikovene rute o profilu korisnika, pravimo sa supertestom http request ka ruti za brisanje profila (deleteMe)
  await request(app)
    .delete("/users/me")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`) //setujemo auth header supertest requesta na berier token koji je sacuvan u bazi (ovo je varijanta kada se okeni cuvaju u bazi u suprotnom bi trebalo drugacije izvesti test)
    .send()
    .expect(200);

  //trazimo user u bazi po id-u koji je dodeljen test useru, i ocekujemo da ga ne nadjemo
  const user = await User.findById(userOneId);
  expect(user).toBeNull();
});

test("Should not delete profile for unauthenticated user", async () => {
  //za dobijanje autentikovene rute o profilu korisnika, pravimo sa supertestom http request ka ruti za brisanje profila (deleteMe)
  await request(app)
    .delete("/users/me") //saljemo zahtev, ali bez setovanja hedera (znaci nema tokena usera i trebalo bid a ne moze da se autentikuje)
    .send()
    .expect(401); //status mora biti onaj koji je i u pravoj ruti
});

test("Should upload avatar image", async () => {
  await request(app)
    .post("/users/me/avatar") //pravi se request supertestom ka ruti za uploadovanje slike (u ovom slucaju ej asebna ruta za upload slike, ukoliko se upload radi u okviru updejta usera, onda se tu ir adi test)
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`) //ruta je zasticena, zato mora da se setuje header sa berrier tokenom fiksnog test usera
    .attach("avatar", "tests/fixtures/profile-pic.jpg") //metoda koja obezbedjujed a supertest atactuje fajl ur ekuast. Prvi argument je field u kome se cuva (kao u postmenu kada se setuje), a drugi argument je put do fajla i to od ruta projekta
    .expect(200);
  //proveravamo da li je slika sacuvana u bazi
  const user = await User.findById(userOneId); // trazimo usera u bazi po id
  expect(user.avatar).toEqual(expect.any(Buffer)); //ne koristi se toBe jer on koristi === sto se ne moze primeniti na objekte {} nje jednako {} jer su razliciti objekti iako su potpunoisti, cuvaju se u memoriji razlicito. Zato se koristi toEqual jer on za poredjenje koristi algoritam koji lupuje kroz propertijeobjekata i uporedi ih. U ovom slucaju ne poredimo objekte direktno, vec ocekujemo da avatar polje u useru (bazi), bude jednako bilo koji buffer
});

test("Should update profile for user", async () => {
  //za dobijanje autentikovene rute o profilu korisnika, pravimo sa supertestom http request ka ruti za updejtovanje profila (updateMe)
  const response = await request(app)
    .patch("/users/me")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`) //setujemo auth header supertest requesta na berier token koji je sacuvan u bazi (ovo je varijanta kada se okeni cuvaju u bazi u suprotnom bi trebalo drugacije izvesti test)
    .send({
      name: "Sandra",
    })
    .expect(200);

  //trazimo user u bazi po id-u koji je dodeljen test useru, i ocekujemo da ga ne nadjemo
  const user = await User.findById(userOneId);
  expect(user.name).toBe(response.body.name);
});

test("Should not update notallowed field", async () => {
  //za dobijanje autentikovene rute o profilu korisnika, pravimo sa supertestom http request ka ruti za updejtovanje profila (updateMe)
  await request(app)
    .patch("/users/me")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`) //setujemo auth header supertest requesta na berier token koji je sacuvan u bazi (ovo je varijanta kada se tokeni cuvaju u bazi u suprotnom bi trebalo drugacije izvesti test)
    .send({
      //salje se u body polje koje nije dozvoljeno (ima funkciju koja filtrira polja koja se ne mogu updejtovati i vraca gersku (vidi))
      location: "Sandra",
    })
    .expect(400); //status mora biti onaj koji je i u pravoj ruti ako se posalje nedozvoljeno polje
});

// Should not signup user with invalid name/email/password
test('Should not signup user with invalid name', async () => {
    await request(app)
        .post('/users')
        .send({
            email: "test@example.fr",
            password: "SuperMotDePasse"
        })
        .expect(400)
})
 
test('Should not signup user with invalid email', async () => {
    await request(app)
        .post('/users')
        .send({
            name:"blalba",
            email: "test.fr",
            password: "SuperMotDePasse"
        })
        .expect(400)
})
 
test('Should not signup user with invalid password', async () => {
    await request(app)
        .post('/users')
        .send({
            name:"blalba",
            email: "test.fr",
            password: "ThePassword"
        })
        .expect(400)
})
 
// Not update user if unauthenticated
test('Should not update user if unauthenticated', async () => {
    await request(app)
        .patch('/users/me')
        .send({
            name: "Franck"
        }).expect(401)
})
 
// Should not update user with invalid name/email/password
test('Should not update user with invalid name', async () => {
    await request(app)
        .patch('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            name: ""
        }).expect(400)
})
 
test('Should not update user with invalid email', async () => {
    await request(app)
        .patch('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            email: "@example.com"
        }).expect(400)
})
 
test('Should not update user with invalid password', async () => {
    await request(app)
        .patch('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            password: "worstpasswordEver"
        }).expect(400)
})
 
// Should not delete user if unauthenticated
test('Should not delete account for unauthenticated user', async () => {
    await request(app)
        .delete('/users/me')
        .set('Authorization', ``)
        .send()
        .expect(401)
})