
const express = require('express');
const router = express.Router();
const { 
    sendMail,
    sendBulkMail, 
    getTemplates, 
    createTemplate, 
    updateTemplate, 
    deleteTemplate, 
    getTemplate 
} = require('../controller/mailController');

// Email sending
router.post("/sendMail", sendMail);
router.post("/sendBulkMail", sendBulkMail);

// Template management
router.get("/templates", getTemplates);
router.get("/templates/:id", getTemplate);
router.post("/templates", createTemplate);
router.put("/templates/:id", updateTemplate);
router.delete("/templates/:id", deleteTemplate);

module.exports = router;