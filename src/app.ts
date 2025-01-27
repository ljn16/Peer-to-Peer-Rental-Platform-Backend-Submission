import express, { Request, Response } from 'express';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

interface Rental {
  startDate: string; 
  endDate: string;   
}

interface Item {
  id: number;
  name: string;
  description: string;
  pricePerDay: number;
  rentals: Rental[];
}

// Store items in memory
let items: Item[] = [];
let currentId: number = 1;


//? Helper Functions
// Validate date strings
const isValidDate = (dateStr: string): boolean => {
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
};

// Check for overlapping dates
const hasOverlap = (existingRentals: Rental[], newRental: Rental): boolean => {
  const newStart = new Date(newRental.startDate);
  const newEnd = new Date(newRental.endDate);

  return existingRentals.some(rental => {
    const existingStart = new Date(rental.startDate);
    const existingEnd = new Date(rental.endDate);
    return (newStart <= existingEnd && newEnd >= existingStart);
  });
};

//? Routes
// LIST Item
app.post('/items', (req: Request, res: Response) => {
  const { name, description, pricePerDay } = req.body;

  // Validate input
  if (!name || typeof pricePerDay !== 'number' || pricePerDay <= 0) {
    return res.status(400).json({ message: 'Invalid item data. "name" and positive "pricePerDay" are required.' });
  }

  const newItem: Item = {
    id: currentId++,
    name,
    description: description || '',
    pricePerDay,
    rentals: []
  };

  items.push(newItem);
  res.status(201).json(newItem);
});

// SEARCH Items
app.get('/items', (req: Request, res: Response) => {
  let { name, minPrice, maxPrice } = req.query;

  let filteredItems = items;

  if (name && typeof name === 'string') {
    const nameLower = name.toLowerCase();
    filteredItems = filteredItems.filter(item => item.name.toLowerCase().includes(nameLower));
  }

  if (minPrice) {
    const min = parseFloat(minPrice as string);
    if (!isNaN(min)) {
      filteredItems = filteredItems.filter(item => item.pricePerDay >= min);
    }
  }

  if (maxPrice) {
    const max = parseFloat(maxPrice as string);
    if (!isNaN(max)) {
      filteredItems = filteredItems.filter(item => item.pricePerDay <= max);
    }
  }

  res.json(filteredItems);
});

// RENT Item
app.post('/rent/:id', (req: Request, res: Response) => {
  const itemId = parseInt(req.params.id, 10);
  const { startDate, endDate } = req.body;

  // Validate input
  if (!startDate || !endDate || !isValidDate(startDate) || !isValidDate(endDate)) {
    return res.status(400).json({ message: 'Invalid dates. "startDate" and "endDate" must be valid date strings.' });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start > end) {
    return res.status(400).json({ message: '"startDate" must be before or equal to "endDate".' });
  }

  const item = items.find(i => i.id === itemId);
  if (!item) {
    return res.status(404).json({ message: 'Item not found.' });
  }

  const newRental: Rental = { startDate, endDate };

  if (hasOverlap(item.rentals, newRental)) {
    return res.status(400).json({ message: 'Rental dates overlap with an existing rental.' });
  }

  item.rentals.push(newRental);
  res.json({ message: 'Item rented successfully.', item });
});

// RETURN Item
app.post('/return/:id', (req: Request, res: Response) => {
  const itemId = parseInt(req.params.id, 10);
  const { returnDate } = req.body;

  const item = items.find(i => i.id === itemId);
  if (!item) {
    return res.status(404).json({ message: 'Item not found.' });
  }

  if (!returnDate || !isValidDate(returnDate)) {
    return res.status(400).json({ message: 'Invalid "returnDate". Must be a valid date string.' });
  }

  const returnDt = new Date(returnDate);

  // Remove rentals that end before the return date
  item.rentals = item.rentals.filter(rental => {
    const rentalEnd = new Date(rental.endDate);
    return rentalEnd >= returnDt;
  });

  res.json({ message: 'Item returned successfully.', item });
});
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


//? Uutility functions for testing
export const resetData = () => {
  items = [];
  currentId = 1;
};

export const addItemDirectly = (item: Item) => {
  items.push(item);
};

export const getItems = () => items;

export default app;