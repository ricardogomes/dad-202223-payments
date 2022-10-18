import express from 'express'
import rateLimit from 'express-rate-limit'

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false
})

const PORT = process.env.PORT || 80
const app = express()
app.use(express.json())
app.use(limiter)

const validPaymentTypes = ['mbway','paypal','visa']

const validateReferences = (data)=>{
  if(!data.type || !data.reference) return false
  switch(data.type){
    case 'mbway':
      return /^9[0-9]{8}$/.test(data.reference)
    case 'paypal':
      return /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(data.reference)
    case 'visa':
      return /^4[0-9]{15}$/.test(data.reference)
    default:
      return false
  }
}

const validateValues = (data)=>{
  if (!data.type || !data.value) return false
  switch(data.type){
    case 'mbway': return data.value <= 10 
    case 'paypal': return data.value <= 50 
    case 'visa': return data.value <= 200 
    default:
      return false
  }
}


app.get('/',(req,res)=>{
  res.send({
    name: 'DAD 202223 Payments API',
    usage: {
      payments: ' POST /api/payments',
      refunds: 'POST /api/refunds'
    }
  })
})

app.post('/api/payments', (req, res)=>{
  console.log(req.body)
  const data = req.body
  if( !data.type || !validPaymentTypes.includes(data.type)) {
    res.status(422)
    return res.send({status:'invalid',message:'invalid type'})
  }
  if(!validateReferences(data)){
    res.status(422)
    return res.send({status:'invalid',message:'invalid reference'})
  }
  if(!data.value || !Number.isInteger(data.value) || data.referece <= 0 || !validateValues(data)) {
    res.status(422)
    return res.send({status:'invalid',message:'invalid value'})
  }
  res.status(201)
  res.send({status:'valid',message:'payment registered'})
})

app.post('/api/refunds', (req, res)=>{
  console.log(req.body)
  const data = req.body
  if( !data.type || !validPaymentTypes.includes(data.type)) {
    res.status(422)
    return res.send({status:'invalid',message:'invalid type'})
  }
  if(!validateReferences(data)){
    res.status(422)
    return res.send({status:'invalid',message:'invalid reference'})
  }
  if(!data.value || !Number.isInteger(data.value) || data.referece <= 0 || !validateValues(data)) {
    res.status(422)
    return res.send({status:'invalid',message:'invalid value'})
  }
  res.status(201)
  res.send({status:'valid',message:'refund registered'})
})


app.listen(PORT, ()=>{
  console.log(`Server Listening on PORT ${PORT}`)
})
