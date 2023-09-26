import express from 'express'
import rateLimit from 'express-rate-limit/dist/index.cjs'
import cors from 'cors'

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false
})

const PORT = process.env.PORT || 80
const app = express()
app.use(express.json())
app.use(limiter)
app.use(cors({
  origin:'*',
  methods: "GET,POST",
  preflightContinue: true,
  optionsSuccessStatus: 204
}))

const validPaymentTypes = ['mbway','paypal','visa']
const validRequestProperties = ['type','reference','value']

const validateBodyProperties = (data) => {
  let res = validRequestProperties.every(prop => data.hasOwnProperty(prop))
  if (!res) {
    return false
  }
  for (let prop in data) {
    if (!validRequestProperties.includes(prop)) {
      return false
    }
  }
  return true
}

const validateReferences = (data) => {
  if(!data.type || !data.reference) return false
  switch(data.type){
    case 'mbway':
      return /^[1-9][0-9]{8}$/.test(data.reference)
    case 'paypal':
      return /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(data.reference)
    case 'visa':
      return /^[1-9][0-9]{15}$/.test(data.reference)
    default:
      return false
  }
}

const validateValue = (data) => {
  if(!data.value) return false
  if (!(typeof data.value === 'number')) return false
  const num = data.value.toFixed(2)
  if (Math.sign(num) !== 1) return false
  return num > 0
}

const validateRequestBody = (data) => {
  if (!validateBodyProperties(data)) {
    return 'invalid request object format'
  }
  if( !validPaymentTypes.includes(data.type)) {
    return 'invalid type'
  }
  if(typeof data.reference != 'string') {
    // should never be String object because it is parse by express.json
    return 'reference must be a string'
  }
  if(!validateReferences(data)){
    return 'invalid reference'
  }
  if(!validateValue(data)) {
    return 'invalid value'
  }
  return '';
}


const simulateValue = (data)=>{
  const num = data.value.toFixed(2)
  switch(data.type){
    case 'mbway': return num <= 10 
    case 'paypal': return num <= 50 
    case 'visa': return num <= 200 
    default:
      return false
  }
}

const simulateReference = (data) => {
  switch(data.type){
    case 'mbway':
      return data.reference.startsWith('9')
    case 'paypal':
      return data.reference.endsWith('.pt') || data.reference.endsWith('.com')
    case 'visa':
      return data.reference.startsWith('4')
    default:
      return false
  }
}


const simulateOperation = (data) => {
  if(!simulateReference(data)){
    return 'payment reference not accepted'
  }
  if(!simulateValue(data)) {
    return 'payment limit exceeded'
  }
  return '';
}

app.get('/',(req,res)=>{
  res.send({
    name: 'DAD 202324 Payments API',
    usage: {
      payments: ' POST /api/payments',
      refunds: 'POST /api/refunds'
    }
  })
})

app.get("/api", (req, res) => {
  res.send({
    name: "DAD 202324 Payments API",
    usage: {
      payments: " POST /api/payments",
      refunds: "POST /api/refunds",
    },
  });
});

app.post('/api/payments', (req, res)=>{
  //console.log(req.body)
  const data = req.body
  let msg = validateRequestBody(data)
  if (msg) {
    res.status(422)
    return res.send({status:'invalid request', message:msg})
  }
  msg = simulateOperation(data)
  if (msg) {
    res.status(422)
    return res.send({status:'invalid operation', message:msg})
  }
  res.status(201)
  res.send({status:'valid',message:'payment registered',value:data.value.toFixed(2)})
})

app.post('/api/refunds', (req, res)=>{
  //console.log(req.body)
  const data = req.body
  let msg = validateRequestBody(data)
  if (msg) {
    res.status(422)
    return res.send({status:'invalid request', message:msg})
  }
  msg = simulateOperation(data)
  if (msg) {
    res.status(422)
    return res.send({status:'invalid operation', message:msg})
  }
  res.status(201)
  res.send({status:'valid',message:'refund registered',value:data.value.toFixed(2)})
})


// app.listen(PORT, ()=>{
//   console.log(`Server Listening on PORT ${PORT}`)
// })

module.exports = app;