I identified the errors by reading the PHP code, then i ported the PHP code to TypeScript.

- The first error was : "$amount = round($total / $count, 2);" It rounded total / count once and reused it for every installment causing it not to sum to the invoice total.
How i solved it: Fixed it by splitting the total into integer cents and distributing them across the first installements.
 
- The second error was:"'due_date' => date('Y-m-d', strtotime("+$i month", strtotime($firstDueDate)))," where it moved to the next month without checking the days if they exist.
How i solved it: Fixed it by computing the target year/month directly and clamping the day to the last valid day of each month.
  
- The third error was on line 51 "return $sum == $total;" where invoices never marked settled because the summed amount rarely land on an exact float match.
How i solved it: Fixed it by comparing in whole cents instead of raw decimals.

*Not bugs today*:
1) over payment beyond the total amount is discarded instead of being flagged
2) no input validation on count <= 0, negative total or negative paid
