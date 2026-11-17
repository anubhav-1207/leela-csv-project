export interface SampleDataset {
  id: string;
  name: string;
  description: string;
  filename: string;
  content: string;
}

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function salesCsv(): string {
  const rand = mulberry32(42);
  const regions = ["North", "South", "East", "West", "Central"];
  const products = [
    ["Aurora Laptop", "Electronics", 1199],
    ["Desk Lamp", "Furniture", 49],
    ["Wireless Mouse", "Electronics", 29],
    ["Notebook", "Stationery", 8],
    ["Standing Desk", "Furniture", 449],
    ["Monitor 27in", "Electronics", 319],
  ] as const;
  const rows: string[] = [
    "Order ID,Date,Region,Product,Category,Units,Unit Price,Revenue,Discount,Returned",
  ];
  for (let i = 1; i <= 80; i++) {
    const product = products[Math.floor(rand() * products.length)];
    const units = 1 + Math.floor(rand() * 9);
    const discount = Math.round(rand() * 25) / 100;
    const revenue = Math.round(units * product[2] * (1 - discount) * 100) / 100;
    const month = 1 + Math.floor(rand() * 12);
    const day = 1 + Math.floor(rand() * 28);
    const date = `2024-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const region = regions[Math.floor(rand() * regions.length)];
    const returned = rand() > 0.88 ? "Yes" : "No";
    const discountText = i % 17 === 0 ? "" : discount.toFixed(2);
    rows.push(
      [
        `ORD-${1000 + i}`,
        date,
        region,
        product[0],
        product[1],
        units,
        product[2].toFixed(2),
        revenue.toFixed(2),
        discountText,
        returned,
      ].join(",")
    );
  }
  // A duplicate row and a missing product name for realistic quality findings.
  rows.push(rows[9]);
  rows[20] = rows[20].replace(/,[^,]+,Electronics,/, ",N/A,Electronics,");
  return rows.join("\n");
}

function analyticsCsv(): string {
  const rand = mulberry32(7);
  const devices = ["Desktop", "Mobile", "Tablet"];
  const countries = ["US", "UK", "DE", "IN", "BR", "JP", "CA"];
  const rows: string[] = [
    "Date,Sessions,Users,Bounce Rate,Avg Duration,Device,Country,Converted",
  ];
  for (let i = 0; i < 120; i++) {
    const month = 1 + Math.floor(rand() * 6);
    const day = 1 + Math.floor(rand() * 28);
    const sessions = 200 + Math.floor(rand() * 1800);
    const users = Math.floor(sessions * (0.6 + rand() * 0.3));
    const bounce = Math.round((25 + rand() * 45) * 10) / 10;
    const duration = Math.round((40 + rand() * 220) * 10) / 10;
    rows.push(
      [
        `2024-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
        sessions,
        users,
        bounce.toFixed(1),
        duration.toFixed(1),
        devices[Math.floor(rand() * devices.length)],
        countries[Math.floor(rand() * countries.length)],
        rand() > 0.7 ? "true" : "false",
      ].join(",")
    );
  }
  return rows.join("\n");
}

function messyCsv(): string {
  const rand = mulberry32(99);
  const departments = ["Sales", "Engineering", "Sales", "Support", "Engineering"];
  const rows: string[] = [
    "Employee ID,Name,Age,Department,Department,Salary,Active,Start Date,Notes",
  ];
  for (let i = 1; i <= 40; i++) {
    const age = i % 11 === 0 ? "unknown" : String(24 + Math.floor(rand() * 35));
    const salary = i % 13 === 0 ? "" : String(40000 + Math.floor(rand() * 90000));
    rows.push(
      [
        `E${100 + i}`,
        `Person ${i}`,
        age,
        departments[Math.floor(rand() * departments.length)],
        departments[Math.floor(rand() * departments.length)],
        salary,
        rand() > 0.2 ? "Yes" : "No",
        `202${1 + Math.floor(rand() * 3)}-0${1 + Math.floor(rand() * 9)}-1${Math.floor(rand() * 9)}`,
        "", // constant / empty column
      ].join(",")
    );
  }
  return rows.join("\n");
}

export const SAMPLES: SampleDataset[] = [
  {
    id: "sales",
    name: "Retail sales",
    description: "Orders with dates, categories, revenue and returns",
    filename: "retail_sales.csv",
    content: salesCsv(),
  },
  {
    id: "analytics",
    name: "Web analytics",
    description: "Sessions, engagement rates, devices and conversions",
    filename: "web_analytics.csv",
    content: analyticsCsv(),
  },
  {
    id: "messy",
    name: "Messy HR data",
    description: "Duplicate columns, mixed types and missing values",
    filename: "messy_hr.csv",
    content: messyCsv(),
  },
];
