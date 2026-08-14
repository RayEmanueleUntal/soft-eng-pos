export interface Customer {
  id: string;
  name: string;
  type: "Retail" | "Wholesale";
  contactInfo: string;
  creditLimit: number;
  isActive: boolean;
}

export interface Supplier {
  id: string;
  companyName: string;
  contactPerson: string;
  contactInfo: string;
  leadTimeDays: number;
}

export const mockCustomers: Customer[] = [
  {
    id: "cust-1",
    name: "Esther Howard",
    type: "Retail",
    contactInfo: "esther@example.com",
    creditLimit: 0,
    isActive: true,
  },
  {
    id: "cust-2",
    name: "BuildRite Construction",
    type: "Wholesale",
    contactInfo: "procurement@buildrite.com",
    creditLimit: 150000,
    isActive: true,
  },
  {
    id: "cust-3",
    name: "Guy Hawkins",
    type: "Retail",
    contactInfo: "0917-123-4567",
    creditLimit: 0,
    isActive: false,
  },
  {
    id: "cust-4",
    name: "Davao Steel Works",
    type: "Wholesale",
    contactInfo: "sales@davaosteel.ph",
    creditLimit: 500000,
    isActive: true,
  },
  {
    id: "cust-5",
    name: "Eleanor Pena",
    type: "Retail",
    contactInfo: "eleanor.p@gmail.com",
    creditLimit: 0,
    isActive: true,
  },
  {
    id: "cust-6",
    name: "Apex Home Builders",
    type: "Wholesale",
    contactInfo: "admin@apexbuilders.ph",
    creditLimit: 300000,
    isActive: true,
  },
  {
    id: "cust-7",
    name: "Kristin Watson",
    type: "Retail",
    contactInfo: "0918-987-6543",
    creditLimit: 0,
    isActive: true,
  },
  {
    id: "cust-8",
    name: "Southern Hardware Depot",
    type: "Wholesale",
    contactInfo: "orders@shdepot.com",
    creditLimit: 250000,
    isActive: false,
  },
  {
    id: "cust-9",
    name: "Jerome Bell",
    type: "Retail",
    contactInfo: "jbell@outdoors.com",
    creditLimit: 0,
    isActive: true,
  },
  {
    id: "cust-10",
    name: "Metro Hardware Express",
    type: "Wholesale",
    contactInfo: "contact@metroexpress.ph",
    creditLimit: 400000,
    isActive: true,
  },
];

export const mockSuppliers: Supplier[] = [
  {
    id: "supp-1",
    companyName: "Manila Fasteners Inc.",
    contactPerson: "Juan Dela Cruz",
    contactInfo: "juan@manilafasteners.ph",
    leadTimeDays: 5,
  },
  {
    id: "supp-2",
    companyName: "Global Lumber Products",
    contactPerson: "Maria Santos",
    contactInfo: "0919-555-0192",
    leadTimeDays: 7,
  },
  {
    id: "supp-3",
    companyName: "Pacific Cement & Aggregates",
    contactPerson: "Robert Tan",
    contactInfo: "sales@pacificcement.com",
    leadTimeDays: 3,
  },
  {
    id: "supp-4",
    companyName: "Visayas Electrical Supply",
    contactPerson: "Ana Lim",
    contactInfo: "0922-888-3411",
    leadTimeDays: 10,
  },
  {
    id: "supp-5",
    companyName: "Mindanao Pipe & Plumbing",
    contactPerson: "Carlos Reyes",
    contactInfo: "carlos@minpipe.ph",
    leadTimeDays: 4,
  },
  {
    id: "supp-6",
    companyName: "Pioneer Steel Manufacturing",
    contactPerson: "Grace Sy",
    contactInfo: "grace.sy@pioneersteel.com",
    leadTimeDays: 14,
  },
  {
    id: "supp-7",
    companyName: "United Paint & Coatings",
    contactPerson: "David Garcia",
    contactInfo: "0917-333-9081",
    leadTimeDays: 2,
  },
  {
    id: "supp-8",
    companyName: "Astra Roof & Sheet Metal",
    contactPerson: "Elena Torralba",
    contactInfo: "elena@astraroof.ph",
    leadTimeDays: 6,
  },
  {
    id: "supp-9",
    companyName: "Titan Power Tools & Machinery",
    contactPerson: "Victor Cruz",
    contactInfo: "sales@titanpowertools.ph",
    leadTimeDays: 8,
  },
  {
    id: "supp-10",
    companyName: "Island Glass & Aluminum",
    contactPerson: "Sofia Mendoza",
    contactInfo: "0918-444-7123",
    leadTimeDays: 5,
  },
];