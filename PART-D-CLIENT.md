# Part D — Client Communication

## Message to the Client

Dear X,

We found an issue with the installment calculation that could cause some invoices to have incorrect due dates, incorrect totals, or remain marked unpaid even after the full amount has been paid. This issue mainly affected invoices that used installment payments.

We fixed the errors that we were facing so that installment amounts and due dates are handled correctly, payments update the invoice total properly and an invoice is marked as settled when the full amount is paid.

Please check a few installment invoices to confirm due dates, remaining balances, and settlement status are correct.

Best,
Russel

## Questions I Would Have Asked

1. Can a client edit or withdraw a request after submitting it?
 Assumption: No, the client can not change anything in the request they already made. If there is any change they have to submit another request.

2. Should there be a "invalid" status for a request that shouldn't be worked at all?
Assumption: each request is expected to complete the full pipeline even it is by error. It should stil move from new->in progress->done.

3. Should the requests that are flagged urgent be sorted to the top of the list?
Assumption: the list stays ordered by the most recent request because the list is not that big so the urgent request being visibly flagged is enough.