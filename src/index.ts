import app from './app';

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Peer-to-Peer Rental backend is running on http://localhost:${PORT}`);
});