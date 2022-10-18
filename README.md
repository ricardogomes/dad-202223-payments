# DAD 2022/23 Mock Payments API

## Usage

With this API we can POST a payment or a refund. Validation rules in the evaluation project statement

```
POST /api/payments

{
  "type": "mbway|paypal|visa",
  "reference": 0000000000,
  "value": 10
}
```

```
POST /api/refunds

{
  "type": "mbway|paypal|visa",
  "reference": 0000000000,
  "value": 10
}
```
