import prisma from "../config/prisma.js";

export const crearProducto = async (req, res) => {
  try {
    const {
      nombre,
      descripcion,
      precio,
      stock,
      codigoBarras,
      categoria,
    } = req.body;

    if (!nombre || precio === undefined) {
      return res.status(400).json({
        mensaje: "El nombre y el precio son obligatorios",
      });
    }

    const producto = await prisma.producto.create({
      data: {
        nombre,
        descripcion: descripcion || null,
        precio: Number(precio),
        stock: Number(stock ?? 0),
        codigoBarras: codigoBarras || null,
        categoria: categoria || null,
      },
    });

    return res.status(201).json({
      mensaje: "Producto creado correctamente",
      producto,
    });
  } catch (error) {
    console.error("Error al crear producto:", error);

    if (error.code === "P2002") {
      return res.status(409).json({
        mensaje: "El código de barras ya está registrado",
      });
    }

    return res.status(500).json({
      mensaje: "Error interno al crear el producto",
    });
  }
};

export const obtenerProductos = async (req, res) => {
  try {
    const productos = await prisma.producto.findMany({
      orderBy: {
        creadoEn: "desc",
      },
    });

    return res.status(200).json(productos);
  } catch (error) {
    console.error("Error al obtener productos:", error);

    return res.status(500).json({
      mensaje: "Error interno al obtener los productos",
    });
  }
};