const CustomPC = require("../models/customPCModel");
const Product = require("../models/productModel");

const startPCBuild = async (req, res) => {
  const { uid, sessionId } = req.body;
  
  if (!uid) {
    return res.status(400).json({ message: "User ID is required" });
  }

  try {
    const pcBuild = new CustomPC({
      user: uid,
      sessionId: sessionId || "default",
      currentStep: "ram",
      status: "in_progress",
      components: {},
      totalPrice: 0
    });

    await pcBuild.save();
    return res.status(201).json({ 
      message: "PC build started! Let's start with selecting RAM.",
      pcBuild,
      currentStep: "ram"
    });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

const getPCBuild = async (req, res) => {
  const { id } = req.params;

  try {
    const pcBuild = await CustomPC.findById(id)
      .populate('components.ram.product')
      .populate('components.ssd.product')
      .populate('components.cpu.product');

    if (!pcBuild) {
      return res.status(404).json({ message: "PC build not found" });
    }

    return res.status(200).json(pcBuild);
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

const getUserPCBuilds = async (req, res) => {
  const { uid } = req.query;

  if (!uid) {
    return res.status(400).json({ message: "User ID is required" });
  }

  try {
    const pcBuilds = await CustomPC.find({ user: uid })
      .populate('components.ram.product')
      .populate('components.ssd.product')
      .populate('components.cpu.product')
      .sort({ createdAt: -1 });

    return res.status(200).json(pcBuilds);
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

const addComponent = async (req, res) => {
  const { buildId, componentType, productId } = req.body;

  if (!buildId || !componentType || !productId) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const validTypes = ['ram', 'ssd', 'cpu', 'gpu', 'psu', 'motherboard', 'aircooler', 'case'];
  if (!validTypes.includes(componentType)) {
    return res.status(400).json({ 
      message: `Invalid component type. Must be one of: ${validTypes.join(', ')}` 
    });
  }

  try {
    const pcBuild = await CustomPC.findById(buildId);
    if (!pcBuild) {
      return res.status(404).json({ message: "PC build not found" });
    }



    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    pcBuild.components[componentType] = {
      product: product._id,
      name: product.name,
      price: product.price,
      specifications: product.specifications || {}
    };

    let total = 0;
    if (pcBuild.components.ram?.price) total += pcBuild.components.ram.price;
    if (pcBuild.components.ssd?.price) total += pcBuild.components.ssd.price;
    if (pcBuild.components.cpu?.price) total += pcBuild.components.cpu.price;
    if (pcBuild.components.gpu?.price) total += pcBuild.components.gpu.price;
    if (pcBuild.components.psu?.price) total += pcBuild.components.psu.price;
    if (pcBuild.components.motherboard?.price) total += pcBuild.components.motherboard.price;
    if (pcBuild.components.aircooler?.price) total += pcBuild.components.aircooler.price;
    if (pcBuild.components.case?.price) total += pcBuild.components.case.price;
    pcBuild.totalPrice = total;

    let nextMessage = "";
    if (componentType === 'ram') {
      pcBuild.currentStep = 'ssd';
      nextMessage = "Great! RAM selected. Now let's choose an SSD.";
    } else if (componentType === 'ssd') {
      pcBuild.currentStep = 'cpu';
      nextMessage = "Excellent! SSD selected. Now let's pick a CPU.";
    } else if (componentType === 'cpu') {
      pcBuild.currentStep = 'gpu';
      nextMessage = "Perfect! CPU selected. Now let's pick a GPU.";
    } else if (componentType === 'gpu') {
      pcBuild.currentStep = 'psu';
      nextMessage = "Great! GPU selected. Now let's choose a PSU.";
    } else if (componentType === 'psu') {
      pcBuild.currentStep = 'motherboard';
      nextMessage = "Excellent! PSU selected. Now let's pick a Motherboard.";
    } else if (componentType === 'motherboard') {
      pcBuild.currentStep = 'aircooler';
      nextMessage = "Perfect! Motherboard selected. Now let's choose an Air Cooler.";
    } else if (componentType === 'aircooler') {
      pcBuild.currentStep = 'case';
      nextMessage = "Great! Air Cooler selected. Now let's pick a Case.";
    } else if (componentType === 'case') {
      pcBuild.currentStep = 'complete';
      pcBuild.status = 'completed';
      nextMessage = "Perfect! Your PC build is complete!";
    }

    await pcBuild.save();

    return res.status(200).json({ 
      message: nextMessage,
      pcBuild,
      currentStep: pcBuild.currentStep,
      componentAdded: pcBuild.components[componentType]
    });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

const cancelPCBuild = async (req, res) => {
  const { id } = req.params;

  try {
    const pcBuild = await CustomPC.findById(id);
    if (!pcBuild) {
      return res.status(404).json({ message: "PC build not found" });
    }

    pcBuild.status = 'cancelled';
    await pcBuild.save();

    return res.status(200).json({ 
      message: "PC build cancelled successfully",
      pcBuild 
    });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

const saveBuildToCart = async (req, res) => {
  const { id } = req.params;

  try {
    const Cart = require("../models/cartModel");
    const pcBuild = await CustomPC.findById(id);
    
    if (!pcBuild) {
      return res.status(404).json({ message: "PC build not found" });
    }

    if (pcBuild.status !== 'completed') {
      return res.status(400).json({ message: "PC build is not complete yet" });
    }

    let cart = await Cart.findOne({ user: pcBuild.user });
    
    if (!cart) {
      cart = new Cart({ user: pcBuild.user, items: [] });
    }

    const componentsToAdd = [];
    if (pcBuild.components.ram?.product) {
      componentsToAdd.push({ product: pcBuild.components.ram.product, quantity: 1 });
    }
    if (pcBuild.components.ssd?.product) {
      componentsToAdd.push({ product: pcBuild.components.ssd.product, quantity: 1 });
    }
    if (pcBuild.components.cpu?.product) {
      componentsToAdd.push({ product: pcBuild.components.cpu.product, quantity: 1 });
    }

    for (const component of componentsToAdd) {
      const itemIndex = cart.items.findIndex(
        item => item.product.toString() === component.product.toString()
      );

      if (itemIndex > -1) {
        cart.items[itemIndex].quantity += component.quantity;
      } else {
        cart.items.push(component);
      }
    }

    await cart.save();

    return res.status(200).json({ 
      message: "PC build saved to cart successfully!",
      cart,
      itemsAdded: componentsToAdd.length
    });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  startPCBuild,
  getPCBuild,
  getUserPCBuilds,
  addComponent,
  cancelPCBuild,
  saveBuildToCart
};

