const express = require("express");
const Task = require("../models/task");
const auth = require("../middleware/auth");
const router = new express.Router();

router.post("/tasks", auth, async (req, res) => {
  // const task = new Task(req.body);
  const task = new Task({
    ...req.body,
    owner: req.user._id,
  });
  try {
    await task.save();
    res.status(201).send(task);
  } catch (err) {
    res.status(400).send(err);
  }
});

router.get("/tasks", auth, async (req, res) => {
  const match = {};
  const sort = {}; //deklarisemo objekat, kojic e da koristimo u populate opcijama umseto sort objekta
  if (req.query.completed) {
    match.completed = req.query.completed === "true"; //postvljamo properti match objekta na vrednost querija, ali ga konvertujemo. Query je string, a nama treba booolean, pa sa  === operaterom, ako je jednako strngu 'true', onda ce vratiti true boolean, u suprotnom vraca false
  }

  if (req.query.sortBy) {
    //ispitujemo da li u queriju imamo properti koji koristimoz a sortiranje
    const parts = req.query.sortBy.split(":");
    sort[parts[0]] = parts[1] === "desc" ? -1 : 1;
    //koristimo prvi elemnt areja i postavljamo ga kao properti sort objekta, a kao vrednost postavljamo +1 ili -1 koji dobijamo na osnovu drugog elementa areja
  }
  try {
    await req.user
      .populate({
        path: "tasks",
        match, //ovo je za filter
        options: {
          limit: parseInt(req.query.limit), //posto je query string, mora da se pretvori u broj
          skip: parseInt(req.query.skip),
          sort,
        },
      })
      .execPopulate();
    res.status(200).send(req.user.tasks);
  } catch (err) {
    res.status(500).send(req.user.err);
  }
});

router.get("/tasks/:id", auth, async (req, res) => {
  const _id = req.params.id;
  try {
    // const task = await Task.findById(_id);
    const task = await Task.findOne({ _id, owner: req.user._id });

    if (!task) {
      return res.status(404).send("Task not found");
    }
    res.status(200).send(task);
  } catch (err) {
    res.status(500).send(err);
  }
});

router.patch("/tasks/:id", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["description", "completed"];
  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update)
  );
  if (!isValidOperation) {
    return res.status(400).send({ error: "Invalid update" });
  }
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });
    updates.forEach((update) => {
      task[update] = req.body[update];
    });
    if (!task) {
      return res.status(404).send("Task not found");
    }
    await task.save();
    res.status(200).send(task);
  } catch (err) {
    res.status(400).send(err);
  }
});

router.delete("/tasks/:id", auth, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id,
    });
    if (!task) {
      return res.status(404).send("Task not found");
    }
    res.send(task);
  } catch (err) {
    res.status(500).send(err);
  }
});

module.exports = router;
