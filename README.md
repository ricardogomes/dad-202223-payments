# DAD 2022/23 Mock Payments API

## Usage

With this API we can POST a payment or a refund. Validation rules in the evaluation project statement

The API is deployed on [Vercel](vercel.com) at https://dad-202324-payments-api.vercel.app/

```
POST https://dad-202324-payments-api.vercel.app/api/payments

{
  "type": "mbway|paypal|visa",
  "reference": 0000000000,
  "value": 10
}
```

```
POST https://dad-202324-payments-api.vercel.app/api/refunds

{
  "type": "mbway|paypal|visa",
  "reference": 0000000000,
  "value": 10
}
```
