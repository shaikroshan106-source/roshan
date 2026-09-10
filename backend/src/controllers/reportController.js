import { firestoreService } from '../services/firestoreService.js';

export const reportController = {
  async getReports(req, res) {
    try {
      const { reportType, authorRole, region, crop } = req.query;
      let reports = await firestoreService.getAll('reports');

      if (reportType) reports = reports.filter(r => r.reportType === reportType);
      if (authorRole) reports = reports.filter(r => r.authorRole === authorRole);
      if (region) reports = reports.filter(r => r.region && r.region.toLowerCase() === region.toLowerCase());
      if (crop) reports = reports.filter(r => r.crop && r.crop.toLowerCase() === crop.toLowerCase());

      reports.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      return res.json({ success: true, count: reports.length, data: reports });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async getReportById(req, res) {
    try {
      const { id } = req.params;
      const report = await firestoreService.getById('reports', id);
      if (!report) {
        return res.status(404).json({ success: false, message: 'Report not found.' });
      }
      return res.json({ success: true, data: report });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  async createReport(req, res) {
    try {
      const user = req.user;
      const { reportType, title, region, crop, data, description, category, priority } = req.body;

      const finalTitle = title || 'Agricultural Quality & Yield Report';
      const finalType = reportType || (category ? `${category} Report` : 'Farmer Field Report');
      const finalRegion = region || user.location || 'Andhra Pradesh';
      const finalData = data || {
        description: description || '',
        category: category || 'General',
        priority: priority || 'normal',
      };

      const reportId = `REP_${user.role ? user.role.toUpperCase() : 'USER'}_${Date.now()}`;
      const newReport = {
        id: reportId,
        reportType: finalType,
        authorId: user.uid,
        authorRole: user.role || 'farmer',
        authorName: user.name || 'Farmer',
        title: finalTitle,
        region: finalRegion,
        crop: crop || 'General Produce',
        data: finalData,
        published: true,
        createdAt: new Date().toISOString(),
      };

      await firestoreService.set('reports', reportId, newReport);

      return res.status(201).json({
        success: true,
        message: 'Agricultural report registered.',
        data: newReport,
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },
};
