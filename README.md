# Jackson's Finances
Various scripts and utilities to assist in reconciling and balancing double-entry book-keeping accounts, mostly for use in [hledger](https://hledger.org/)

Not guaranteed to work, these scripts assume setups similar to mine, mostly working with Australian dollars (AUD), New Zealand dollars (NZD), and United States dollars (USD).

## Docs
### New Zealand student loan importing
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