import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { mkConfig, generateCsv, asString } from "export-to-csv";
const csvconfig = mkConfig({ useKeysAsHeaders: true });
const USER_PAT = await readFile("./.up-bank-token", { encoding: "utf8" });

const UP_BANK_BASE_URL = "https://api.up.com.au/api/v1";
const CATEGORY_ACCOUNT_MAP: Record<string, string> = {
  "games-and-software": "expenses:personal:games-and-software",
  booze: "expenses:personal:booze",
  "events-and-gigs": "expenses:personal:events-and-gigs",
  hobbies: "expenses:personal:hobbies",
  "holidays-and-travel": "expenses:personal:holidays-and-travel",
  "lottery-and-gambling": "expenses:personal:lottery-and-gambling",
  "pubs-and-bars": "expenses:personal:pubs-and-bars",
  "restaurants-and-cafes": "expenses:personal:restaurants-and-cafes",
  takeaway: "expenses:personal:takeaway",
  "tobacco-and-vaping": "expenses:personal:tobacco-and-vaping",
  "tv-and-music": "expenses:personal:tv-and-music",
  adult: "expenses:personal:adult",
  family: "expenses:personal:family",
  "clothing-and-accessories": "expenses:personal:clothing-and-accessories",
  "education-and-student-loans":
    "expenses:personal:education-and-student-loans",
  "fitness-and-wellbeing": "expenses:personal:fitness-and-wellbeing",
  "gifts-and-charity": "expenses:personal:gifts-and-charity",
  "hair-and-beauty": "expenses:personal:hair-and-beauty",
  "health-and-medical": "expenses:personal:health-and-medical",
  investments: "expenses:personal:investments",
  "life-admin": "expenses:personal:life-admin",
  "mobile-phone": "expenses:personal:mobile-phone",
  "news-magazines-and-books": "expenses:personal:news-magazines-and-books",
  technology: "expenses:personal:technology",
  groceries: "expenses:household:groceries",
  "homeware-and-appliances": "expenses:household:homeware-and-appliances",
  internet: "expenses:household:internet",
  "home-maintenance-and-improvements":
    "expenses:household:home-maintenance-and-improvements",
  pets: "expenses:household:pets",
  "home-insurance-and-rates": "expenses:household:home-insurance-and-rates",
  "rent-and-mortgage": "expenses:household:rent-and-mortgage",
  utilities: "expenses:household:utilities",
  "car-insurance-and-maintenance":
    "expenses:transport:car-insurance-and-maintenance",
  cycling: "expenses:transport:cycling",
  fuel: "expenses:transport:fuel",
  parking: "expenses:transport:parking",
  "public-transport": "expenses:transport:public-transport",
  "car-repayments": "expenses:transport:car-repayments",
  "taxis-and-share-cars": "expenses:transport:taxis-and-share-cars",
  "toll-roads": "expenses:transport:toll-roads",
};

const txns = await get(50);
const rows: any[] = [];
for await (const txn of txns) {
  if (txn.attributes.status !== "SETTLED") {
    console.log(
      'skipping non-settled txn in state "',
      txn.attributes.status,
      '"'
    );
  }

  const expenseAccount = CATEGORY_ACCOUNT_MAP[getCategory(txn)] || "unknown";

  const row = {
    settled: txn.attributes.settledAt,
    description: txn.attributes.description,
    amount: txn.attributes.amount.value,
    currency: txn.attributes.amount.currencyCode,
    originator: "assets:cash",
    account: expenseAccount,
    id: txn.id,
  };
  if (
    txn.relationships.account.data.id === "13a07245-83dd-44b7-84d9-25522064db7c"
  ) {
    continue;
  }
  if (txn.relationships.transferAccount.data) {
    row.account = "assets:cash:" + txn.relationships.transferAccount.data.id;
  }
  if (txn.attributes.transactionType === "Salary") {
    row.account = "income:salary";
  }
  rows.push(row);

  console.log(
    `${row.settled} | ${row.description} | ${row.amount} ${row.currency} | ${row.account} | ${row.id}`
  );
}
const output = generateCsv(csvconfig)(rows);
await writeFile(
  "au_up_bank/data/txns.csv",
  new Uint8Array(Buffer.from(asString(output)))
);

function getCategory(txn: UpTransaction): string {
  if (txn.relationships.category.data) {
    if (txn.relationships.category.data.type === "categories") {
      return txn.relationships.category.data.id;
    }
  }
  return "Uncategorized";
}

async function get(pageSize: number = 50): Promise<UpTransaction[]> {
  if (existsSync("au_up_bank/data/all_txns_raw.json")) {
    const data = await readFile("au_up_bank/data/all_txns_raw.json", {
      encoding: "utf8",
    });
    return JSON.parse(data).data;
  }
  const txns: UpTransaction[] = [];
  let next = `${UP_BANK_BASE_URL}/transactions?page[size]=${pageSize}`;
  while (next) {
    const response = await fetch(next, {
      headers: {
        Authorization: `Bearer ${USER_PAT.trim()}`,
      },
    });
    if (!response.ok) {
      throw new Error(
        `Error fetching transactions: ${response.status} ${response.statusText}`
      );
    }
    const res = (await response.json()) as UpTransactionResponse;

    txns.push(...res.data);
    next = res.links.next;
  }

  await mkdir("au_up_bank/data", { recursive: true });
  await writeFile(
    "au_up_bank/data/all_txns_raw.json",
    JSON.stringify({ data: txns }, null, 2),
    { encoding: "utf8" }
  );

  return txns;
}

interface UpTransaction {
  type: string;
  id: string;
  attributes: {
    status: "HELD" | "SETTLED";
    rawText: string | null;
    description: string;
    message: string | null;
    isCategorizable: boolean;
    holdInfo: any;
    roundUp: any;
    cashback: any;
    amount: {
      currencyCode: string;
      value: string;
      valueInBaseUnits: number;
    };
    foreignAmount: any;
    cardPurchaseMethod: any;
    settledAt: Date | null;
    createdAt: Date;
    transactionType: any;
    note: any;
    performingCustomer: {
      displayName: string;
    };
    deepLinkURL: string;
  };
  relationships: {
    account: {
      data: {
        type: string;
        id: string;
      };
      links: {
        related: string;
      };
    };
    transferAccount: {
      data: any;
    };
    category: {
      data: any;
      links: {
        self: string;
      };
    };
    parentCategory: {
      data: any;
    };
    tags: {
      data: Array<{
        type: string;
        id: string;
      }>;
      links: {
        self: string;
      };
    };
    attachment: {
      data: any;
    };
  };
  links: {
    self: string;
  };
}
interface UpTransactionResponse {
  data: Array<UpTransaction>;
  links: {
    prev: any;
    next: any;
  };
}
