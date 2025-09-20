const express = require('express');
const crypto = require('crypto');
const { sendReportEmail, sendStatusUpdateEmail } = require('../lib/mailer');
const { isFirestoreActive, saveReport, getReport, updateReport, getReportsByUser } = require('../lib/firestore');

const router = express.Router();

// In-memory store as a fallback if Firestore is not configured
const reportsStore = new Map();

// --- Validation ---
const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

// --- Endpoint: Create a new report ---
router.post('/', async (req, res) => {
  try {
    const { title, description, reporterEmail } = req.body;

    // 1. Validate inputs
    if (!title || !description || !reporterEmail) {
      return res.status(400).json({ error: 'Missing required fields: title, description, reporterEmail.' });
    }
    if (!validateEmail(reporterEmail)) {
      return res.status(400).json({ error: 'Invalid reporterEmail format.' });
    }

    // 2. Create report record
    const reportId = crypto.randomUUID();
    const report = {
      id: reportId,
      title,
      description,
      reporterEmail,
      status: 'Received',
      createdAt: new Date().toISOString(),
      location: "Lat: 0, Lon: 0" 
    };

    // 3. Save report (Firestore or in-memory)
    if (isFirestoreActive()) {
      await saveReport(reportId, report);
    } else {
      reportsStore.set(reportId, report);
      console.log('Firestore not configured. Storing report in-memory.');
    }

    // 4. Send email notification to admin
    await sendReportEmail(report);

    // 5. Respond to client
    res.status(201).json({ ok: true, id: reportId });
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ error: 'Failed to create report.' });
  }
});

// --- Endpoint: Update a report's status ---
router.post('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    // 1. Validate inputs
    if (!status) {
      return res.status(400).json({ error: 'Missing required field: status.' });
    }

    // 2. Fetch the existing report
    let originalReport;
    if (isFirestoreActive()) {
      originalReport = await getReport(id);
    } else {
      originalReport = reportsStore.get(id);
    }

    if (!originalReport) {
      return res.status(404).json({ error: 'Report not found.' });
    }

    // 3. Update the report
    const updateData = {
      status,
      remarks: remarks || '', // Remarks are optional
      updatedAt: new Date().toISOString(),
    };

    if (isFirestoreActive()) {
      await updateReport(id, updateData);
    } else {
      const updatedReport = { ...originalReport, ...updateData };
      reportsStore.set(id, updatedReport);
      console.log(`Updated in-memory report ${id}`);
    }

    // 4. Send status update email to the original reporter
    await sendStatusUpdateEmail(originalReport, updateData);

    // 5. Respond to client
    res.status(200).json({ ok: true });
  } catch (error) {
    console.error(`Error updating status for report ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to update report status.' });
  }
});

// --- Endpoint: Get a single report by its ID ---
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let report;

    // 1. Fetch the report from the correct data source
    if (isFirestoreActive()) {
      report = await getReport(id);
    } else {
      report = reportsStore.get(id);
    }

    // 2. If no report is found, send a 404 error
    if (!report) {
      return res.status(404).json({ error: 'Report not found.' });
    }

    // 3. If found, send it back in the expected format
    res.status(200).json({ ok: true, report });

  } catch (error) {
    console.error(`Error fetching report ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch report.' });
  }
});

// --- Endpoint: Get all reports by user email ---
router.get('/user/:email', async (req, res) => {
  try {
    const { email } = req.params;

    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format.' });
    }

    let reports;
    if (isFirestoreActive()) {
      reports = await getReportsByUser(email); // Firestore helper function
    } else {
      reports = Array.from(reportsStore.values()).filter(
        (r) => r.reporterEmail === email
      );
    }

    res.status(200).json({ ok: true, reports });
  } catch (error) {
    console.error(`Error fetching reports for user:`, error);
    res.status(500).json({ error: 'Failed to fetch reports.' });
  }
});

module.exports = router;