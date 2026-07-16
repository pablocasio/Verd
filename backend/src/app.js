import express from "express";
import productoRoutes from "./routes/producto.routes.js";

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    mensaje: "Backend de VERD funcionando",
  });
});

app.use("/api/productos", productoRoutes);

export default app;