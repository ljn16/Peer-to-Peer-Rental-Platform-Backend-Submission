# Peer-to-Peer Rental Backend
- Make HTTP requests to the backend 
- Data is stored in-memory with arrays
- Run tests using Jest
- TypeScript used to improve code quality

## Source files:
- app.ts - contains routes and logic
- app.test.ts - contains testing for the app, and can be utilized without starting the server
- index.ts - imports app and starts the server 

## Start the backend: 
Install dependencies: 
```bash
npm install
```

Start the backend: 
```bash
npm run dev
```

## Endpoints
- POST /items             -> List an item
- GET /items              -> Search items (by name or price range)
- POST /rent/:id          -> Rent an item for a specified date range
- POST /return/:id        -> Return an item (makes it available again)

### Interact with endpoints
Use Postman (or any other REST client) to reach endpoints
Examples:
    - List item: 
        POST http://localhost:3000/items
        Body: { "name": "Camera", "description": "Sony a7iv digital camera", "pricePerDay": 50 }
    - Seach item:
        GET http://localhost:3000/items?name=drill&minPrice=10&maxPrice=20
    - Rent item:
        POST http://localhost:3000/rent/1
        Body: { "startDate": "2025-01-25", "endDate": "2025-01-27" }
    - Return item:
        POST http://localhost:3000/return/1
        Body: { "returnDate": "2025-01-11" }

## Run tests
```bash
npm run test
```