const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

function list(req, res) {
    res.json({ data: orders });
}

function bodyDataHas(propertyName) {
    return function (req, res, next) {
        const { data = {} } = req.body;
        const property = data[propertyName]
        if (!property) {
            return next({ status: 400, message: `Order must include a ${propertyName}` });
        }
        if (propertyName === "dishes") {
            if (!Array.isArray(property) || !property.length) {
                return next({ status: 400, message: `Order must include at least one dish` });
            }
            for (let index = 0; index < property.length; index++) {
                const dish = property[index];
                const dishQuantity = dish.quantity;

                if (!dishQuantity || Number.isNaN(dishQuantity) || !Number.isInteger(dishQuantity) || parseFloat(dishQuantity) <= 0) {
                    return next({ status: 400, message: `Dish ${index} must have a quantity that is an integer greater than 0` });
                }
            }
        }
        return next();
    };
}

function create(req, res) {
    const { data: { deliverTo, mobileNumber, dishes: [{ name, syntax, exposure, expiration, text, user_id } = {}] } = {} } = req.body;
    const newOrder = {
      id: nextId(),
      deliverTo,
      mobileNumber,
      status: "pending",
      dishes: [{name, syntax, exposure, expiration, text, user_id}],
    };
    orders.push(newOrder);
    res.status(201).json({ data: newOrder });
  }
  
  function orderExists(req, res, next) {
    const { orderId } = req.params;
    const foundOrder = orders.find(order => order.id === orderId);
    if (foundOrder) {
      res.locals.order = foundOrder;
      return next();
    }
    next({
      status: 404,
      message: `Order does not exist: ${orderId}.`,
    });
  }

  function read(req, res, next) {
    const foundOrder = res.locals.order
    res.json({ data: foundOrder });
  };

  function idsMatch(req, res, next) {
    const { orderId } = req.params;
    const { data: { id } = {} } = req.body;
    if (!id || orderId == id) {
      return next();
    }
    next({
      status: 400,
      message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.
      `
    })
  }

  function statusPropertyIsValid(req, res, next) {
    const { data: { status } = {} } = req.body;
    const validStatus = ["pending", "preparing", "out-for-delivery"];
    const invalidStatus = ["delivered"]
    if (validStatus.includes(status)) {
      return next();
    }
    if (invalidStatus.includes(status)) {
        return next({
            status: 400,
            message: `A delivered order cannot be changed`,
          });
    }
    next({
      status: 400,
      message: `Order must have a status of pending, preparing, out-for-delivery, delivered`,
    });
  }
  
  function update(req, res) {
    const order = res.locals.order;
    const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
    order.deliverTo = deliverTo;
    order.mobileNumber = mobileNumber;
    order.status = status;
    order.dishes = dishes;
    res.json({ data: order });
  
  }

  function pendingOrder(req, res, next) {
    const status = res.locals.order.status;
    const validStatus = ["pending"];
    if (validStatus.includes(status)) {
      return next()
    }
    return next({
            status: 400,
            message: `An order cannot be deleted unless it is pending.`,
          });
  }

  function destroy(req, res) {
    const order = res.locals.order;
    orders.splice(order, 1);
    res.sendStatus(204);
  }

  module.exports = {
    create: [
      bodyDataHas("deliverTo"),
      bodyDataHas("mobileNumber"),
      bodyDataHas("dishes"),
      create
    ],
    list,
    read: [orderExists, read],
    update: [
      orderExists,
      idsMatch,
      statusPropertyIsValid,
      bodyDataHas("deliverTo"),
      bodyDataHas("mobileNumber"),
      bodyDataHas("status"),
      bodyDataHas("dishes"),
      update
    ],
    delete: [orderExists, pendingOrder, destroy],
  };