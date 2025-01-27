import request from 'supertest';
import app, { resetData } from './app';

describe('Peer-to-Peer Rental Platform API', () => {
  let createdItemId: number;

  // Reset data before each test
  beforeEach(() => {
    resetData();
  });

  //? Test POST /items
  describe('POST /items', () => {
    it('should create a new item with valid data', async () => {
      const newItem = {
        name: 'Drill',
        description: 'Power drill',
        pricePerDay: 15
      };

      const response = await request(app)
        .post('/items')
        .send(newItem)
        .expect(201)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(newItem.name);
      expect(response.body.description).toBe(newItem.description);
      expect(response.body.pricePerDay).toBe(newItem.pricePerDay);
      expect(response.body.rentals).toEqual([]);

      createdItemId = response.body.id;
    });

    it('should return 400 for invalid data', async () => {
      const invalidItem = {
        description: 'No name provided',
        pricePerDay: -10
      };

      const response = await request(app)
        .post('/items')
        .send(invalidItem)
        .expect(400)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('message');
    });
  });

  //? Test GET /items
  describe('GET /items', () => {
    beforeEach(async () => {
      // Create items to search for
      const items = [
        { name: 'Drill', description: 'Power drill', pricePerDay: 15 },
        { name: 'Hammer', description: 'Claw hammer', pricePerDay: 10 },
        { name: 'Ladder', description: '10ft ladder', pricePerDay: 20 },
      ];

      for (const item of items) {
        await request(app).post('/items').send(item);
      }
    });

    it('should retrieve all items when no filters are applied', async () => {
      const response = await request(app)
        .get('/items')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body.length).toBe(3);
    });

    it('should filter items by name', async () => {
      const response = await request(app)
        .get('/items')
        .query({ name: 'drill' })
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body.length).toBe(1);
      expect(response.body[0].name.toLowerCase()).toContain('drill');
    });

    it('should filter items by price range', async () => {
      const response = await request(app)
        .get('/items')
        .query({ minPrice: 12, maxPrice: 18 })
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body.length).toBe(1);
      expect(response.body[0].pricePerDay).toBe(15);
    });
  });

  //? Test POST /rent/:id
  describe('POST /rent/:id', () => {
    beforeEach(async () => {
      // Create an item to rent
      const newItem = {
        name: 'Drill',
        description: 'Power drill',
        pricePerDay: 15
      };

      const response = await request(app).post('/items').send(newItem);
      createdItemId = response.body.id;
    });

    it('should rent an item for a valid date range', async () => {
      const rental = {
        startDate: '2025-01-10',
        endDate: '2025-01-12'
      };

      const response = await request(app)
        .post(`/rent/${createdItemId}`)
        .send(rental)
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('message', 'Item rented successfully.');
      expect(response.body.item.rentals).toContainEqual(rental);
    });

    it('should prevent overlapping rentals', async () => {
      const rental1 = {
        startDate: '2025-01-10',
        endDate: '2025-01-12'
      };

      // First rental
      await request(app).post(`/rent/${createdItemId}`).send(rental1).expect(200);

      const overlappingRental = {
        startDate: '2025-01-11', // (Overlaps with rental)
        endDate: '2025-01-13'
      };

      const response = await request(app)
        .post(`/rent/${createdItemId}`)
        .send(overlappingRental)
        .expect(400)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('message', 'Rental dates overlap with an existing rental.');
    });

    it('should return 404 for non-existent item', async () => {
      const rental = {
        startDate: '2025-02-01',
        endDate: '2025-02-05'
      };

      const response = await request(app)
        .post('/rent/9999') // (there is no item with ID 9999)
        .send(rental)
        .expect(404)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('message', 'Item not found.');
    });

    it('should return 400 for invalid dates', async () => {
      const invalidRental = {
        startDate: 'invalid-date',
        endDate: '2025-01-12'
      };

      const response = await request(app)
        .post(`/rent/${createdItemId}`)
        .send(invalidRental)
        .expect(400)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 if startDate is after endDate', async () => {
      const invalidRental = {
        startDate: '2025-01-15',
        endDate: '2025-01-10'
      };

      const response = await request(app)
        .post(`/rent/${createdItemId}`)
        .send(invalidRental)
        .expect(400)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('message', '"startDate" must be before or equal to "endDate".');
    });
  });

  //? Test POST /return/:id
  describe('POST /return/:id', () => {
    beforeEach(async () => {
      // Create an item and rent it
      const newItem = {
        name: 'Drill',
        description: 'Power drill',
        pricePerDay: 15
      };

      const response = await request(app).post('/items').send(newItem);
      createdItemId = response.body.id;

      const rental = {
        startDate: '2025-01-10',
        endDate: '2025-01-12'
      };

      await request(app).post(`/rent/${createdItemId}`).send(rental).expect(200);
    });

    it('should return an item by removing past rentals', async () => {
      const returnDate = {
        returnDate: '2025-01-15'
      };

      const response = await request(app)
        .post(`/return/${createdItemId}`)
        .send(returnDate)
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('message', 'Item returned successfully.');
      expect(response.body.item.rentals.length).toBe(0);
    });

    it('should not remove ongoing or future rentals', async () => {
      const returnDate = {
        returnDate: '2025-01-11' // Only rentals ending before 2025-01-11 are removed
      };

      const response = await request(app)
        .post(`/return/${createdItemId}`)
        .send(returnDate)
        .expect(200)
        .expect('Content-Type', /json/);

      // The rental ends 2025-01-12, which is after 2025-01-11, so it shouldn't be removed
      expect(response.body.item.rentals.length).toBe(1);
    });

    it('should return 404 for non-existent item', async () => {
      const returnDate = {
        returnDate: '2025-01-15'
      };

      const response = await request(app)
        .post('/return/9999') // Assuming 9999 is a non-existent ID
        .send(returnDate)
        .expect(404)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('message', 'Item not found.');
    });

    it('should return 400 for invalid returnDate', async () => {
      const invalidReturnDate = {
        returnDate: 'invalid-date'
      };

      const response = await request(app)
        .post(`/return/${createdItemId}`)
        .send(invalidReturnDate)
        .expect(400)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('message');
    });
  });
});