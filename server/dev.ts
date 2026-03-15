// Development server entry point
import { createServer } from "./src/server.js";

const app = createServer();
const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`🚀 Development server running on http://localhost:${port}`);
});
