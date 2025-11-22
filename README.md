# Jackson's Finance Tools
Various scripts and utilities to assist in reconciling and balancing double-entry book-keeping accounts, mostly for use in [hledger](https://hledger.org/)

Not guaranteed to work, these scripts assume setups similar to mine, mostly working with Australian dollars (AUD), New Zealand dollars (NZD), and United States dollars (USD).

# Docs
## Up Bank transaction processing (`au_up_bank`)
Currently a bit of a mess, but to use this you need to add your [Up (Bendigo & Adelaide) Bank personal access token](https://developer.up.com.au/#welcome) to `.up-bank-token`.

Then, you can use `scroll_txns.ts` to query all your transactions (cached in `data/`), and format it into a CSV (`data/txns.csv`), which you can then read with hledger:
```
hledger -f au_up_bank/data/txns.csv --rules-file au_up_bank/txns.csv.rules bal
```
It tries to use Up's automatic transaction categorisation as much as possible, although I need to change it to use tags (if the user has applied them). Salary transactions (BPAY) are automatically sent to `income:salary`.

Both `scroll_txns.ts` and `txns.csv.rules` contain highly personalised routing rules that would only apply to my account, so you'll need to tinker with these until they are right for you.

## New Zealand student loan importing (`nz_sls`)
`nz_sls` contains a `hledger` ruleset for importing transactions exported from the New Zealand Inland Revenue Department (IRD) from a New Zealand student loan account (account type `SLS`).

Because IRD has a strange format, you'll need to do a small amount of cleaning before importing:
```
sed 's/\$//g' ~/Downloads/sls.csv | hledger -f csv:- --rules-file nz_sls/txns.csv.rules bal
        NZD 3,560.37  assets:cash
        NZD 9,416.85  expenses:education:tuition
      NZD -14,319.40  liabilities:loans:nz_student_loan
          NZD 160.00  liabilities:loans:nz_student_loan:fees
        NZD 1,182.18  liabilities:loans:nz_student_loan:interest
--------------------
                   0
```
### Copyright
Creative Commons Zero (CC0)