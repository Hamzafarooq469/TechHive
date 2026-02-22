
const Shipping = require("../models/shippingModel")

const addShipping = async (req, res) => {
    const { fullName, address, city, postalCode, country, uid } = req.body;
    console.log("Received from frontend", req.body)
    try {
        if(!fullName || !address || !city || !postalCode || !country || !uid) {
            return res.status(400).json({message: "Please add all the fields"})
        }
        const shipping = new Shipping({
            fullName, address, city, postalCode, country, user: uid
        })
        await shipping.save()
        return res.status(200).json({ message: "Shipping added successfully", shipping})
    } catch (error) {
        console.log("Error in adding shipping", error.message)
    }
}

const getAllShipping = async (req, res) => {
  const { id } = req.params; 
  console.log(req.params)

  if (!id) {
    return res.status(400).json({ message: 'Please send user id' });
  }

  try {
    const shipping = await Shipping.find({ user: id });
    if (!shipping || shipping.length === 0) {
      return res.status(404).json({ message: 'No shipping info found' });
    }
    return res.status(200).json({ message: 'Shipping found', shipping });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const getShippingStatsByCity = async (req, res) => {
  try {
    const data = await Shipping.aggregate([
      {
        $group: {
          _id: "$city",
          total: { $sum: 1 }
        }
      },
      {
        $sort: { total: -1 }
      }
    ]);

    res.status(200).json({ message: "Success", data });
  } catch (error) {
    console.error("Error in getShippingStatsByCity:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};



module.exports = {
    addShipping,
    getAllShipping,
    getShippingStatsByCity
}