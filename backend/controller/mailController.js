
const addEmailJob = require("../queue/producer/addEmailjob");
const EmailTemplate = require("../models/emailTemplateModel");
const User = require("../models/userModel");
const CustomerProfile = require("../models/customerProfileModel");

const sendMail = async (req, res) => {
    const { senderMail, receiverMail, subject, message, jobType } = req.body;
    const timestamp = new Date().toISOString();
    

    
    try {
        // Validate required fields
        if (!receiverMail || !subject || !message) {
            console.error("❌ VALIDATION FAILED - Missing required fields");
            console.error("Missing:", {
                receiverMail: !receiverMail,
                subject: !subject,
                message: !message
            });
            return res.status(400).json({ 
                message: "Please provide receiverMail, subject, and message." 
            });
        }

        // Prepare email HTML content
        const html = `
            <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
                ${senderMail ? `<p style="color: #666;"><strong>From:</strong> ${senderMail}</p>` : ''}
                <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">${subject}</h2>
                <div style="margin-top: 20px; line-height: 1.6; color: #444;">
                    ${message.replace(/\n/g, '<br>')}
                </div>
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px;">
                    <p>This email was sent from TechHive</p>
                </div>
            </div>
        `;

        const text = `Subject: ${subject}\n\n${message}`;

        const emailJobType = jobType || 'default';

        const jobResult = await addEmailJob({
            to: receiverMail,
            subject: subject,
            html: html,
            text: text,
            jobType: emailJobType,
            queue: "emailQueue"
        });



        return res.status(200).json({ 
            message: "Email queued successfully!",
            jobType: emailJobType,
            priority: emailJobType === 'order' ? 1 : emailJobType === 'signup' ? 2 : 3
        });

    } catch (error) {

        return res.status(500).json({ 
            message: "Failed to queue email",
            error: error.message 
        });
    }
}

const sendBulkMail = async (req, res) => {
    const { senderMail, subject, message, jobType, filters } = req.body;
    const timestamp = new Date().toISOString();
    

    
    try {
        // Validate required fields
        if (!subject || !message) {
            return res.status(400).json({ 
                message: "Please provide subject and message." 
            });
        }

        let recipients = [];

        if (filters.sendToAll) {
            const users = await User.find({ role: 'user' });
            recipients = users.map(u => u.email);
        } else if (filters.specificEmails && filters.specificEmails.length > 0) {
            recipients = filters.specificEmails;
        } else {
            const query = {};

            if (filters.gender && filters.gender !== 'all') {
                query.gender = filters.gender;
            }

            if (filters.ageMin || filters.ageMax) {
                query.age = {};
                if (filters.ageMin && !isNaN(filters.ageMin)) {
                    query.age.$gte = Number(filters.ageMin);
                }
                if (filters.ageMax && !isNaN(filters.ageMax)) {
                    query.age.$lte = Number(filters.ageMax);
                }
            }

            if (filters.maritalStatus && filters.maritalStatus !== 'all') {
                query.maritalStatus = filters.maritalStatus;
            }

            if (filters.education && filters.education.length > 0) {
                query.education = { $in: filters.education };
            }

            if (filters.frequency && filters.frequency.length > 0) {
                query.frequency = { $in: filters.frequency };
            }

            if (filters.discountImportance && filters.discountImportance.length > 0) {
                query.discountImportance = { $in: filters.discountImportance };
            }

            if (filters.monthlySpendingMin || filters.monthlySpendingMax) {
                query.monthlySpending = {};
                if (filters.monthlySpendingMin && !isNaN(filters.monthlySpendingMin)) {
                    query.monthlySpending.$gte = Number(filters.monthlySpendingMin);
                }
                if (filters.monthlySpendingMax && !isNaN(filters.monthlySpendingMax)) {
                    query.monthlySpending.$lte = Number(filters.monthlySpendingMax);
                }
            }

            if (filters.birthdayFilter) {
                const today = new Date();
                const currentMonth = today.getMonth();
                const currentDay = today.getDate();

                if (filters.birthdayFilter === 'today') {
                    // Users with birthday today
                    query.$expr = {
                        $and: [
                            { $eq: [{ $month: '$dateOfBirth' }, currentMonth + 1] },
                            { $eq: [{ $dayOfMonth: '$dateOfBirth' }, currentDay] }
                        ]
                    };
                } else if (filters.birthdayFilter === 'thisWeek') {
                    const weekEnd = new Date(today);
                    weekEnd.setDate(weekEnd.getDate() + 7);
                    query.$expr = {
                        $and: [
                            { $gte: [{ $month: '$dateOfBirth' }, currentMonth + 1] },
                            { $lte: [{ $month: '$dateOfBirth' }, weekEnd.getMonth() + 1] }
                        ]
                    };
                } else if (filters.birthdayFilter === 'thisMonth') {
                    query.$expr = {
                        $eq: [{ $month: '$dateOfBirth' }, currentMonth + 1]
                    };
                }
            }

            console.log("📊 Query:", JSON.stringify(query, null, 2));

            // Find matching customer profiles
            const profiles = await CustomerProfile.find(query);
            
            if (profiles.length === 0) {
                return res.status(404).json({ 
                    message: "No users found matching the specified criteria." 
                });
            }

            const userUIDs = profiles.map(profile => profile.user);
            
            const users = await User.find({ uid: { $in: userUIDs } });
            
            const userMap = {};
            users.forEach(user => {
                userMap[user.uid] = user;
            });

            recipients = profiles
                .map(profile => userMap[profile.user])
                .filter(user => user && user.email)
                .map(user => user.email);
        }

        if (recipients.length === 0) {
            return res.status(404).json({ 
                message: "No valid email addresses found." 
            });
        }

        console.log(`📧 Found ${recipients.length} recipients`);

        const html = `
            <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">${subject}</h2>
                <div style="margin-top: 20px; line-height: 1.6; color: #444;">
                    ${message.replace(/\n/g, '<br>')}
                </div>
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px;">
                    <p>This email was sent from TechHive</p>
                </div>
            </div>
        `;

        const text = `Subject: ${subject}\n\n${message}`;
        const emailJobType = jobType || 'default';

        const emailJobs = recipients.map(email => 
            addEmailJob({
                to: email,
                subject: subject,
                html: html,
                text: text,
                jobType: emailJobType,
                queue: "emailQueue"
            })
        );

        await Promise.all(emailJobs);



        return res.status(200).json({ 
            message: `Emails queued successfully to ${recipients.length} recipients!`,
            recipientCount: recipients.length,
            jobType: emailJobType
        });

    } catch (error) {

        return res.status(500).json({ 
            message: "Failed to queue emails",
            error: error.message 
        });
    }
};

// Get all templates
const getTemplates = async (req, res) => {
    try {
        const templates = await EmailTemplate.find().sort({ createdAt: -1 });
        return res.status(200).json(templates);
    } catch (error) {
        console.error("Error fetching templates:", error);
        return res.status(500).json({ message: "Failed to fetch templates", error: error.message });
    }
};

// Create new template
const createTemplate = async (req, res) => {
    try {
        const { name, subject, content, styles } = req.body;
        
        if (!name || !subject || !content) {
            return res.status(400).json({ message: "Please provide name, subject, and content" });
        }

        const template = new EmailTemplate({
            name,
            subject,
            content,
            styles: styles || {}
        });

        await template.save();
        console.log("✅ Template created:", name);
        
        return res.status(201).json({ message: "Template created successfully", template });
    } catch (error) {
        console.error("Error creating template:", error);
        return res.status(500).json({ message: "Failed to create template", error: error.message });
    }
};

// Update template
const updateTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, subject, content, styles } = req.body;

        const template = await EmailTemplate.findByIdAndUpdate(
            id,
            { name, subject, content, styles, updatedAt: Date.now() },
            { new: true }
        );

        if (!template) {
            return res.status(404).json({ message: "Template not found" });
        }

        console.log("✅ Template updated:", template.name);
        return res.status(200).json({ message: "Template updated successfully", template });
    } catch (error) {
        console.error("Error updating template:", error);
        return res.status(500).json({ message: "Failed to update template", error: error.message });
    }
};

// Delete template
const deleteTemplate = async (req, res) => {
    try {
        const { id } = req.params;

        const template = await EmailTemplate.findByIdAndDelete(id);

        if (!template) {
            return res.status(404).json({ message: "Template not found" });
        }

        console.log("✅ Template deleted:", template.name);
        return res.status(200).json({ message: "Template deleted successfully" });
    } catch (error) {
        console.error("Error deleting template:", error);
        return res.status(500).json({ message: "Failed to delete template", error: error.message });
    }
};

// Get single template
const getTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        const template = await EmailTemplate.findById(id);

        if (!template) {
            return res.status(404).json({ message: "Template not found" });
        }

        return res.status(200).json(template);
    } catch (error) {
        console.error("Error fetching template:", error);
        return res.status(500).json({ message: "Failed to fetch template", error: error.message });
    }
};

module.exports = {
    sendMail,
    sendBulkMail,
    getTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    getTemplate
}