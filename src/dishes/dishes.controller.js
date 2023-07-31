const path = require("path");
const dishes = require(path.resolve("src/data/dishes-data"));

function list(req, res) {
  const { dishId } = req.params;
  res.json({ data: dishes.filter(dishId ? dish => dish.id == dishId : () => true) });
}

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

function bodyDataHas(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    const parameter = data[propertyName]
    if (!parameter) {
      return next({ status: 400, message: `Dish must include a ${propertyName}` });
    }
    if (propertyName === "price") {
      if (parameter.length || parameter <= 0) return next({ status: 400, message: `Dish must have a price that is an integer greater than 0` });
    }
    return next();
  };
}


function create(req, res) {
  const { data: { name, description, price, image_url } = {} } = req.body;
  const newDish = {
    id: nextId(),
    name,
    description,
    price,
    image_url,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

function dishExists(req, res, next) {
  const { dishId } = req.params;
  const foundDish = dishes.find(dish => dish.id === dishId);
  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  }
  next({
    status: 404,
    message: `Dish does not exist: ${dishId}.`,
  });
}

function read(req, res, next) {
  const foundDish = res.locals.dish
  res.json({ data: foundDish });
};

function idsMatch(req, res, next) {
  const { dishId } = req.params;
  const { data: { id } = {} } = req.body;
  if (!id || dishId == id) {
    return next();
  }
  next({
    status: 400,
    message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`
  })
}

function update(req, res) {
  const dish = res.locals.dish;
  const { data: { name, description, price, image_url } = {} } = req.body;
  dish.name = name;
  dish.description = description;
  dish.price = price;
  dish.image_url = image_url;
  res.json({ data: dish });

}

module.exports = {
  create: [
    bodyDataHas("name"),
    bodyDataHas("description"),
    bodyDataHas("price"),
    bodyDataHas("image_url"),
    create
  ],
  list,
  read: [dishExists, read],
  update: [
    dishExists,
    idsMatch,
    bodyDataHas("name"),
    bodyDataHas("description"),
    bodyDataHas("price"),
    bodyDataHas("image_url"),
    update
  ],
};