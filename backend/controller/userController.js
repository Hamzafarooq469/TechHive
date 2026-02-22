
const User = require("../models/userModel")
const admin = require("../services/Firebase/firebaseAdmin")
const addEmailJob = require("../queue/producer/addEmailjob");
const generateWelcomeEmail = require("../templates/welcomeEmailTemplate");

const signUp = async (req, res) => {
    const { name, email, uid, token } = req.body
    console.log("Getting this in backend", req.body)
    try {
        if( !name || !email || !uid || !token) {
            return res.status(401).json({ messsage: "Please add all the fields" })
        }

        const existingUserByEmail = await User.findOne({ email })
        const existingUserByUID = await User.findOne({ uid })

        if(existingUserByEmail || existingUserByUID) {
            return res.status(400).json({ message: "User with this email or id already exists"})
        }

        const user = new User({
            name, email, uid, role: "user"
        })
        await user.save()
        
        // Send welcome email
        try {
            const { html, text } = generateWelcomeEmail({
                userName: user.name,
                userEmail: user.email
            });

            await addEmailJob({
                to: user.email,
                subject: 'Welcome to TechHive!',
                html: html,
                text: text,
                jobType: 'signup',
                queue: 'emailQueue'
            });

            console.log(` Welcome email queued for ${user.email}`);
        } catch (emailError) {
            console.error(' Failed to send welcome email:', emailError.message);
        }
        
        // const customToken = await admin.auth().createCustomToken(uid);
        res.status(201).json({
            message: "User created successfully",
            user: {
                name: user.name,
                email: user.email,
                uid: user.uid,
                role: user.role 
            },
            // token: customToken
        })

    } catch (error) {
        console.error("Error signing up:", error);
        return res.status(500).json({ message: "Server error" });
        
    }
}

const signIn = async (req, res) => {
    try {
        const { idToken } = req.body;
        console.log("Request body:", req.body);

        if (!idToken || typeof idToken !== "string") {
            return res.status(400).json({ message: "Missing or invalid token" });
        }

        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const { uid, email } = decodedToken;

        let user = await User.findOne({ email });

        if (!user) {
            console.log("Email not found, trying UID...");
            user = await User.findOne({ uid });
        }
        if (!user) {
            return res.status(401).json({ message: "User not found in database" });
        }

        return res.status(200).json({
            message: "User authenticated",
            user: { name: user.name, email: user.email, uid: user.uid, role: user.role, token:idToken },
        });

    } catch (error) {
        console.error("Sign-in error:", error.message);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
};

const signOut = async (req, res) => {
    try {
        
    } catch (error) {
        
    }
}

const getAllUsersForAdmin = async (req, res) => {
    try {
        const users = await User.find().select('name email role uid createdAt _id').lean();
        return res.status(200).json(users)
    } catch (error) {
      console.error("Error fetching products:", error);
    }
}

const forgotPassword = async (req, res) => {
      const { email } = req.body;

  try {
    // 1. Check if user exists in MongoDB
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // 2. Get Firebase user
    const firebaseUser = await admin.auth().getUserByEmail(email);

    // 3. Generate reset password link
    const resetLink = await admin.auth().generatePasswordResetLink(email);

    // 4. You can also send it via your custom email handler (optional)
    // sendEmail(email, resetLink);

    return res.status(200).json({ message: 'Reset link sent', link: resetLink });
  } catch (error) {
    console.error('Error in forgot-password:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}

const UsersCreatedOverTimeChart = async (req, res) => {
  try {
    const stats = await User.aggregate([
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m", date: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, 'uid name email role'); // Only get necessary fields
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// Search users by name or email
const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.trim().length === 0) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    // Search users by name or email (case-insensitive)
    const users = await User.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ],
      role: 'user' // Only search regular users, not admins
    })
    .select('name email')
    .limit(20); // Limit to 20 results

    res.status(200).json(users);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
};

module.exports = {
    signUp,
    signIn,
    getAllUsersForAdmin,
    forgotPassword,
    UsersCreatedOverTimeChart,
    getAllUsers,
    searchUsers
}