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

export const obtenerProductoPorId = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        mensaje: "El ID debe ser un número válido",
      });
    }

    const producto = await prisma.producto.findUnique({
      where: { id },
    });

    if (!producto) {
      return res.status(404).json({
        mensaje: "Producto no encontrado",
      });
    }

    return res.status(200).json(producto);
  } catch (error) {
    console.error("Error al buscar producto:", error);

    return res.status(500).json({
      mensaje: "Error interno al buscar el producto",
    });
  }
};

export const actualizarProducto = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        mensaje: "El ID debe ser un número válido",
      });
    }

    const {
      nombre,
      descripcion,
      precio,
      stock,
      codigoBarras,
      categoria,
    } = req.body;

    const producto = await prisma.producto.update({
      where: { id },
      data: {
        ...(nombre !== undefined && { nombre }),
        ...(descripcion !== undefined && { descripcion }),
        ...(precio !== undefined && { precio: Number(precio) }),
        ...(stock !== undefined && { stock: Number(stock) }),
        ...(codigoBarras !== undefined && { codigoBarras }),
        ...(categoria !== undefined && { categoria }),
      },
    });

    return res.status(200).json({
      mensaje: "Producto actualizado correctamente",
      producto,
    });
  } catch (error) {
    console.error("Error al actualizar producto:", error);

    if (error.code === "P2025") {
      return res.status(404).json({
        mensaje: "Producto no encontrado",
      });
    }

    if (error.code === "P2002") {
      return res.status(409).json({
        mensaje: "El código de barras ya está registrado",
      });
    }

    return res.status(500).json({
      mensaje: "Error interno al actualizar el producto",
    });
  }
};

export const eliminarProducto = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        mensaje: "El ID debe ser un número válido",
      });
    }

    await prisma.producto.delete({
      where: { id },
    });

    return res.status(200).json({
      mensaje: "Producto eliminado correctamente",
    });
  } catch (error) {
    console.error("Error al eliminar producto:", error);

    if (error.code === "P2025") {
      return res.status(404).json({
        mensaje: "Producto no encontrado",
      });
    }

    return res.status(500).json({
      mensaje: "Error interno al eliminar el producto",
    });
  }
};