const request = require("supertest");
const app = require("../src/app");
const Task = require("../src/models/task");
const {
  userOneId,
  userOne,
  userTwoId,
  userTwo,
  taskOne,
  taskTwo,
  taskThree,
  setupDatbase,
} = require("./fixtures/db"); //ukljucuju se delovi db fajla koji su nam potrebni (id usera, test user i fnkcija za setapovanje baze)

beforeEach(setupDatbase);

test("Should create task for user", async () => {
  const response = await request(app)
    .post("/tasks") //pokrecemo rutu za kreiranje resursa
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`) //ako je ruta zasticena autentokacijom, moramo setovati header ur equestu (ako s ene cuva u bazu, po meni je ejdini nacin je da se nakon setovanja podataka o useru, van usera kreira i user token (slicno kao id user pre setovanja pdoataka o useru), a zatim taj token koristi za autentikaciju, alid a se ovde ukljuci u fajl)
    .send({
      description: "Test",
    })
    .expect(201);

  //trazimo kreirani task u bazi i proveravamod a li postoji
  const task = await Task.findById(response.body._id);
  expect(task).not.toBeNull();
  expect(task.completed).toBe(false); //provera va se da li je polje setovano an fals. ovo de provera difoltnog setovanja ukoliko se vrednost ne obezbedi
});

test("Should get tasks for user one", async () => {
  const response = await request(app)
    .get("/tasks")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`) //ako je ruta zasticena autentokacijom, moramo setovati header ur equestu (ako s ene cuva u bazu, po meni je ejdini nacin je da se nakon setovanja podataka o useru, van usera kreira i user token (slicno kao id user pre setovanja pdoataka o useru), a zatim taj token koristi za autentikaciju, alid a se ovde ukljuci u fajl)
    .send()
    .expect(200);

  expect(response.body.length).toEqual(2); //u test bazi je setovano da userOne ima dva taska (kao owner), zato s ei prave u test abzi razlicite situacije
});

test("Should not delete task of another user", async () => {
  const response = await request(app)
    .delete(`/tasks/${taskOne._id}`) //uzimamo id taska koji pripada useruOne
    .set("Authorization", `Bearer ${userTwo.tokens[0].token}`) //autorizujemo useraTwo
    .send()
    .expect(404); //treba da bazi ovaj status kod (videti rutu)

  //trazimo task po id u bazi i ispitujemo da li postoji (trebalo bi da postoji)
  const task = await Task.findById(taskOne._id);
  expect(task).not.toBeNull();
});

// not create task with invalid description/completed
test("Should not create task with invalid description", async () => {
  await request(app)
    .post("/tasks")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send({
      description: "",
    })
    .expect(400);
});

test("Should not create task with invalid completed", async () => {
  await request(app)
    .post("/tasks")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send({
      description: "test invalid completed",
      completed: 1234,
    })
    .expect(400);
});

// not update task with invalid description/completed
test("Should not update task with invalid description", async () => {
  await request(app)
    .patch(`/tasks/${taskOne._id}`)
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send({
      description: "",
    })
    .expect(400);
});

test("Should not update task with invalid completed", async () => {
  await request(app)
    .patch(`/tasks/${taskOne._id}`)
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send({
      completed: 1234,
    })
    .expect(400);
});

// delete user task
test("Should delete user task", async () => {
  const response = await request(app)
    .delete(`/tasks/${taskOne._id}`)
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);

  const task = await Task.findById(response.body._id);
  expect(task).toBeNull();
});

// Should not delete task if unauthenticated
test("Should delete user task", async () => {
  const response = await request(app)
    .delete(`/tasks/${taskOne._id}`)
    .send()
    .expect(401);
});

// not update other users task
test("Should not update other users task", async () => {
  await request(app)
    .patch(`/tasks/${taskTwo._id}`)
    .set("Authorization", `Bearer ${userTwo.tokens[0].token}`)
    .send({
      description: "test not update other users task",
    })
    .expect(400);
});

// fetch user task by id
test("Should fetch user task by id", async () => {
  const response = await request(app)
    .get(`/tasks/${taskOne._id}`)
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);

  const task = await Task.findById(response.body._id);
  expect(task.description).toEqual("First Task");
});

// not fetch user task by id if unauthenticated
test("Should not fetch user task by id if unauthenticated", async () => {
  const response = await request(app)
    .get(`/tasks/${taskOne._id}`)
    .send()
    .expect(401);
});

// not fetch other users task by id
test("Should not fetch other users task by id", async () => {
  const response = await request(app)
    .get(`/tasks/${taskOne._id}`)
    .set("Authorization", `Bearer ${userTwo.tokens[0].token}`)
    .send()
    .expect(404);
});

// Should fetch only completed tasks
test("fetch only completed tasks", async () => {
  const response = await request(app)
    .get("/tasks?completed=true")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);

  expect(response.body.length).toEqual(1);
});

// Should fetch only incomplete tasks
test("fetch only incompleted tasks", async () => {
  const response = await request(app)
    .get("/tasks?completed=false")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);

  expect(response.body.length).toEqual(1);
});

// sort tasks by description/completed/createdAt/updatedAt
test("Should sort tasks by description", async () => {
  const response = await request(app)
    .get("/tasks?sortBy=description:desc")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);

  expect(response.body[0].description).toEqual("Second Task");
});

test("Should sort tasks by completed", async () => {
  const response = await request(app)
    .get("/tasks?sortBy=completed:desc")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);

  expect(response.body[0].description).toEqual("Second Task");
});

test("Should sort tasks by createdAt", async () => {
  const response = await request(app)
    .get("/tasks?sortBy=createdAt:desc")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);

  expect(response.body[0].description).toEqual("Second Task");
});

test("Should sort tasks by updatedAt", async () => {
  const response = await request(app)
    .get("/tasks?sortBy=updatedAt:desc")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);

  expect(response.body[0].description).toEqual("Second Task");
});

// fetch page of tasks
test("Should fetch page of tasks", async () => {
  const response = await request(app)
    .get("/tasks?sortBy=createdAt:desc&limit=1&skip=1")
    .set("Authorization", `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);

  expect(response.body[0].description).toEqual("First Task");
});
