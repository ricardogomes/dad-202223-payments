const express = require("express");
const rateLimit = require("express-rate-limit");
const cors = require("cors");

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});

const PORT = process.env.PORT || 8080;
const app = express();
app.use(express.json())
app.use(limiter);
app.use(
  cors({
    origin: "*",
    methods: "GET,POST",
    preflightContinue: true,
    optionsSuccessStatus: 204,
  })
);

const validPaymentTypes = ["MBWAY", "PAYPAL", "VISA", "MB", "IBAN"];
const validRequestProperties = ["type", "reference", "value"];

const validateBodyProperties = (data) => {
  let res = validRequestProperties.every((prop) => data.hasOwnProperty(prop));
  if (!res) {
    return false;
  }
  for (let prop in data) {
    if (!validRequestProperties.includes(prop)) {
      return false;
    }
  }
  return true;
};

const validateReferences = (data) => {
  if (!data.type || !data.reference) return false;
  switch (data.type) {
    case "MBWAY":
      return /^[1-9][0-9]{8}$/.test(data.reference);
    case "PAYPAL":
      return /^[a-zA-Z0-9.!#$%&’*+\/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(
        data.reference
      );
    case "VISA":
      return /^[1-9][0-9]{15}$/.test(data.reference);
    case "MB":
      return /^[1-9][0-9]{4}\-[1-9][0-9]{8}$/.test(data.reference);
    case "IBAN":
      return /^[A-Z]{2}[0-9]{23}$/.test(data.reference);
    default:
      return false;
  }
};

const validateValue = (data) => {
  if (!data.value) return false;
  if (!(typeof data.value === "number")) return false;
  const num = data.value.toFixed(2);
  if (Math.sign(num) !== 1) return false;
  return num > 0;
};

const validateRequestBody = (data) => {
  if (!validateBodyProperties(data)) {
    return "invalid request object format";
  }
  if (!validPaymentTypes.includes(data.type)) {
    return "invalid type";
  }
  if (typeof data.reference != "string") {
    // should never be String object because it is parse by express.json
    return "reference must be a string";
  }
  if (!validateReferences(data)) {
    return "invalid reference";
  }
  if (!validateValue(data)) {
    return "invalid value";
  }
  return "";
};

const simulateValue = (data) => {
  const num = data.value.toFixed(2);
  switch (data.type) {
    case "MBWAY":
      return num <= 50;
    case "PAYPAL":
      return num <= 100;
    case "VISA":
      return num <= 200;
    case "MB":
      return num <= 500;
    case "IBAN":
      return num <= 1000;
    default:
      return false;
  }
};

const simulateReference = (data) => {
  switch (data.type) {
    case "MBWAY":
      return data.reference.startsWith("9");
    case "PAYPAL":
      return !data.reference.startsWith("xx");
    case "VISA":
      return data.reference.startsWith("4");
    case "MB":
      return !data.reference.startsWith("9");
    case "IBAN":
      return !data.reference.startsWith("XX");
    default:
      return false;
  }
};

const simulateOperation = (data) => {
  if (!simulateReference(data)) {
    return "payment reference not accepted";
  }
  if (!simulateValue(data)) {
    return "payment limit exceeded";
  }
  return "";
};

app.get("/api", (req, res) => {
  res.send({
    name: "DAD 202324 Payments API",
    usage: {
      credits: " POST /api/credits",
      debits: "POST /api/debits",
    },
  });
});

app.post("/api/debit", (req, res) => {
  const data = req.body;
  let msg = validateRequestBody(data);
  if (msg) {
    res.status(422);
    return res.send({ status: "invalid request", message: msg });
  }
  msg = simulateOperation(data);
  if (msg) {
    res.status(422);
    return res.send({ status: "invalid operation", message: msg });
  }
  res.status(201);
  res.send({
    status: "valid",
    message: "debit registered",
    value: data.value.toFixed(2),
  });
});

app.post("/api/credit", (req, res) => {
  const data = req.body;
  let msg = validateRequestBody(data);
  if (msg) {
    res.status(422);
    return res.send({ status: "invalid request", message: msg });
  }
  msg = simulateOperation(data);
  if (msg) {
    res.status(422);
    return res.send({ status: "invalid operation", message: msg });
  }
  res.status(201);
  res.send({
    status: "valid",
    message: "credit registered",
    value: data.value.toFixed(2),
  });
});

module.exports = app;
